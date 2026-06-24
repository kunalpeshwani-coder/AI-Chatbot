<?php

namespace App\Services;

use App\Models\DatabaseConnection;
use PDO;
use PDOException;

class DatabaseSyncService
{
    private const ALLOWED_DRIVERS = ['mysql', 'pgsql'];
    private const ROW_LIMIT       = 500;
    private const CHAR_BUDGET_PER_TABLE = 8000;

    // Opens a short-lived connection to verify credentials and list available tables/views.
    public function listTables(string $driver, string $host, int $port, string $database, string $username, string $password): array
    {
        $pdo = $this->connect($driver, $host, $port, $database, $username, $password);

        return match ($driver) {
            'mysql' => $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN),
            'pgsql' => $pdo->query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")->fetchAll(PDO::FETCH_COLUMN),
        };
    }

    // Lists tables available on an already-saved connection, using its stored credentials.
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

    // Pulls the selected tables and turns each into a Document the chatbot can search over.
    public function sync(DatabaseConnection $connection): void
    {
        try {
            $pdo = $this->connect(
                $connection->driver,
                $connection->host,
                $connection->port,
                $connection->database,
                $connection->username,
                $connection->password,
            );

            $availableTables = match ($connection->driver) {
                'mysql' => $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN),
                'pgsql' => $pdo->query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")->fetchAll(PDO::FETCH_COLUMN),
            };

            foreach ($connection->tables as $table) {
                // Only ever query tables we just confirmed exist — table names can't be bound as PDO params.
                if (!in_array($table, $availableTables, true) || !preg_match('/^[A-Za-z0-9_]+$/', $table)) {
                    continue;
                }

                $identifier = $connection->driver === 'mysql' ? "`{$table}`" : "\"{$table}\"";
                $stmt = $pdo->query("SELECT * FROM {$identifier} LIMIT " . self::ROW_LIMIT);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $text   = $this->rowsToText($table, $rows);
                $document = $connection->documents()->where('original_name', $table)->first();

                $attrs = [
                    'chatbot_id'     => $connection->chatbot_id,
                    'original_name'  => $table,
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

            $connection->update(['status' => 'connected', 'error_message' => null, 'last_synced_at' => now()]);
        } catch (\Throwable $e) {
            $connection->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
        }
    }

    private function connect(string $driver, string $host, int $port, string $database, string $username, string $password): PDO
    {
        if (!in_array($driver, self::ALLOWED_DRIVERS, true)) {
            throw new \InvalidArgumentException("Unsupported database driver: {$driver}");
        }

        $dsn = $driver === 'mysql'
            ? "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4"
            : "pgsql:host={$host};port={$port};dbname={$database}";

        try {
            return new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT            => 5,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $e) {
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
                fn ($value, $col) => "{$col}: " . (is_null($value) ? 'null' : $value),
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
}
