<?php

namespace App\Services;

use App\Models\DatabaseConnection;
use PDO;
use PDOException;

class DatabaseSyncService
{
    private const ALLOWED_DRIVERS = ['mysql', 'mariadb', 'pgsql', 'sqlsrv', 'oci', 'sqlite', 'mongodb'];
    private const ROW_LIMIT       = 500;
    private const CHAR_BUDGET_PER_TABLE = 8000;

    // Opens a short-lived connection to verify credentials and list available tables/collections.
    public function listTables(string $driver, string $host, int $port, string $database, string $username, string $password): array
    {
        if ($driver === 'mongodb') {
            return $this->listMongoCollections($host, $port, $database, $username, $password);
        }

        $pdo = $this->connect($driver, $host, $port, $database, $username, $password);

        return match ($driver) {
            'mysql', 'mariadb' => $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN),
            'pgsql' => $pdo->query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")->fetchAll(PDO::FETCH_COLUMN),
            'sqlsrv' => $pdo->query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")->fetchAll(PDO::FETCH_COLUMN),
            'oci' => $pdo->query('SELECT table_name FROM user_tables ORDER BY table_name')->fetchAll(PDO::FETCH_COLUMN),
            'sqlite' => $pdo->query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")->fetchAll(PDO::FETCH_COLUMN),
        };
    }

    // Lists tables/collections available on an already-saved connection, using its stored credentials.
    public function listTablesForConnection(DatabaseConnection $connection): array
    {
        return $this->listTables(
            $connection->driver,
            $connection->host,
            $connection->port,
            $connection->database,
            $connection->username,
            $connection->password,
        );
    }

    // Pulls the selected tables/collections and turns each into a Document the chatbot can search over.
    public function sync(DatabaseConnection $connection): void
    {
        try {
            if ($connection->driver === 'mongodb') {
                $this->syncMongo($connection);
            } else {
                $this->syncSql($connection);
            }

            $connection->update(['status' => 'connected', 'error_message' => null, 'last_synced_at' => now()]);
        } catch (\Throwable $e) {
            $connection->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
        }
    }

    private function syncSql(DatabaseConnection $connection): void
    {
        $pdo = $this->connect(
            $connection->driver,
            $connection->host,
            $connection->port,
            $connection->database,
            $connection->username,
            $connection->password,
        );

        $availableTables = match ($connection->driver) {
            'mysql', 'mariadb' => $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN),
            'pgsql' => $pdo->query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")->fetchAll(PDO::FETCH_COLUMN),
            'sqlsrv' => $pdo->query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")->fetchAll(PDO::FETCH_COLUMN),
            'oci' => $pdo->query('SELECT table_name FROM user_tables ORDER BY table_name')->fetchAll(PDO::FETCH_COLUMN),
            'sqlite' => $pdo->query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")->fetchAll(PDO::FETCH_COLUMN),
        };

        foreach ($connection->tables as $table) {
            // Only ever query tables we just confirmed exist — table names can't be bound as PDO params.
            if (!in_array($table, $availableTables, true) || !preg_match('/^[A-Za-z0-9_]+$/', $table)) {
                continue;
            }

            $identifier = match ($connection->driver) {
                'mysql', 'mariadb' => "`{$table}`",
                'sqlsrv' => "[{$table}]",
                default => "\"{$table}\"",
            };

            $sql = match ($connection->driver) {
                'sqlsrv' => "SELECT TOP " . self::ROW_LIMIT . " * FROM {$identifier}",
                'oci'    => "SELECT * FROM {$identifier} FETCH FIRST " . self::ROW_LIMIT . " ROWS ONLY",
                default  => "SELECT * FROM {$identifier} LIMIT " . self::ROW_LIMIT,
            };

            $stmt = $pdo->query($sql);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $this->upsertTableDocument($connection, $table, $rows);
        }
    }

    private function syncMongo(DatabaseConnection $connection): void
    {
        $client = $this->connectMongo($connection->host, $connection->port, $connection->database, $connection->username, $connection->password);
        $db     = $client->selectDatabase($connection->database);

        $availableCollections = [];
        foreach ($db->listCollections() as $info) {
            $availableCollections[] = $info->getName();
        }

        foreach ($connection->tables as $collection) {
            if (!in_array($collection, $availableCollections, true) || !preg_match('/^[A-Za-z0-9_]+$/', $collection)) {
                continue;
            }

            $cursor = $db->selectCollection($collection)->find([], ['limit' => self::ROW_LIMIT]);
            $rows   = [];
            foreach ($cursor as $document) {
                $rows[] = $this->bsonToArray($document);
            }

            $this->upsertTableDocument($connection, $collection, $rows);
        }
    }

    private function upsertTableDocument(DatabaseConnection $connection, string $name, array $rows): void
    {
        $text     = $this->rowsToText($name, $rows);
        $document = $connection->documents()->where('original_name', $name)->first();

        $attrs = [
            'chatbot_id'     => $connection->chatbot_id,
            'original_name'  => $name,
            'file_type'      => 'database',
            'size_bytes'     => strlen($text),
            'extracted_text' => $text,
            'status'         => 'processed',
        ];

        if ($document) {
            $document->update($attrs);
        } else {
            $connection->documents()->create($attrs);
        }
    }

    private function listMongoCollections(string $host, int $port, string $database, string $username, string $password): array
    {
        $client = $this->connectMongo($host, $port, $database, $username, $password);

        $collections = [];
        foreach ($client->selectDatabase($database)->listCollections() as $info) {
            $collections[] = $info->getName();
        }

        return $collections;
    }

    private function connectMongo(string $host, int $port, string $database, string $username, string $password): \MongoDB\Client
    {
        if (!class_exists(\MongoDB\Client::class)) {
            throw new \RuntimeException(
                'MongoDB support requires the "mongodb" PHP extension and the "mongodb/mongodb" Composer '
                . 'package to be installed on the server.'
            );
        }

        $auth = $username !== '' ? rawurlencode($username) . ':' . rawurlencode($password) . '@' : '';
        $uri  = "mongodb://{$auth}{$host}:{$port}/{$database}";

        try {
            return new \MongoDB\Client($uri, [], ['connectTimeoutMS' => 5000]);
        } catch (\Throwable $e) {
            throw new \RuntimeException('Could not connect: ' . $e->getMessage());
        }
    }

    // Flattens a BSON document (including nested objects/arrays) into a plain associative array of strings.
    private function bsonToArray(\MongoDB\Model\BSONDocument $document): array
    {
        $json = \MongoDB\BSON\toJSON(\MongoDB\BSON\fromPHP($document));

        return json_decode($json, true) ?? [];
    }

    private function connect(string $driver, string $host, int $port, string $database, string $username, string $password): PDO
    {
        if (!in_array($driver, self::ALLOWED_DRIVERS, true)) {
            throw new \InvalidArgumentException("Unsupported database driver: {$driver}");
        }

        $dsn = match ($driver) {
            'mysql', 'mariadb' => "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4",
            'pgsql'  => "pgsql:host={$host};port={$port};dbname={$database}",
            'sqlsrv' => "sqlsrv:Server={$host},{$port};Database={$database}",
            'oci'    => "oci:dbname=//{$host}:{$port}/{$database}",
            'sqlite' => "sqlite:{$database}",
        };

        try {
            return new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT            => 5,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $e) {
            if (!in_array($driver, ['mysql', 'mariadb', 'pgsql', 'sqlite'], true)) {
                throw new \RuntimeException(
                    "Could not connect: {$e->getMessage()} (driver \"{$driver}\" also requires its PDO "
                    . "extension to be installed and enabled on the server — pdo_sqlsrv or pdo_oci)."
                );
            }
            throw new \RuntimeException('Could not connect: ' . $e->getMessage());
        }
    }

    private function rowsToText(string $table, array $rows): string
    {
        if (empty($rows)) {
            return "Table \"{$table}\" has no rows.";
        }

        $lines  = ["Data from table \"{$table}\":"];
        $budget = self::CHAR_BUDGET_PER_TABLE;

        foreach ($rows as $row) {
            $line = implode(', ', array_map(
                fn ($value, $col) => "{$col}: " . $this->stringifyValue($value),
                $row,
                array_keys($row),
            ));

            if ($budget - strlen($line) <= 0) {
                break;
            }

            $lines[]  = $line;
            $budget  -= strlen($line);
        }

        return implode("\n", $lines);
    }

    private function stringifyValue(mixed $value): string
    {
        if (is_null($value)) {
            return 'null';
        }

        if (is_array($value)) {
            return json_encode($value);
        }

        return (string) $value;
    }
}
