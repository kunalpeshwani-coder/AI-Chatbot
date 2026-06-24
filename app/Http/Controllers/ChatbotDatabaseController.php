<?php

namespace App\Http\Controllers;

use App\Models\Chatbot;
use App\Models\DatabaseConnection;
use App\Services\DatabaseSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatbotDatabaseController extends Controller
{
    public function __construct(private DatabaseSyncService $sync) {}

    public function index(Request $request, Chatbot $chatbot): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);

        return response()->json($chatbot->databaseConnections()->latest()->get());
    }

    // Verifies credentials and returns the list of tables the client can choose from — nothing is saved yet.
    public function testConnection(Request $request, Chatbot $chatbot): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);

        $data = $this->validateCredentials($request);
        $data['password'] ??= '';

        try {
            $tables = $this->sync->listTables(
                $data['driver'], $data['host'], $data['port'],
                $data['database'], $data['username'], $data['password'],
            );
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['tables' => $tables]);
    }

    public function store(Request $request, Chatbot $chatbot): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);

        $data = $this->validateCredentials($request);
        $data['password'] ??= '';
        $data['tables'] = $request->validate([
            'tables'   => ['required', 'array', 'min:1'],
            'tables.*' => ['string'],
        ])['tables'];

        $connection = $chatbot->databaseConnections()->create($data);

        $this->sync->sync($connection);

        return response()->json($connection->fresh(), 201);
    }

    public function resync(Request $request, Chatbot $chatbot, DatabaseConnection $connection): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);
        abort_if($connection->chatbot_id !== $chatbot->id, 404);

        $this->sync->sync($connection);

        return response()->json($connection->fresh());
    }

    // Lists tables on an already-connected database, so the client can pick more to add.
    public function availableTables(Request $request, Chatbot $chatbot, DatabaseConnection $connection): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);
        abort_if($connection->chatbot_id !== $chatbot->id, 404);

        try {
            $tables = $this->sync->listTablesForConnection($connection);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['tables' => $tables]);
    }

    // Adds more tables to an existing connection and syncs the new ones in.
    public function addTables(Request $request, Chatbot $chatbot, DatabaseConnection $connection): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);
        abort_if($connection->chatbot_id !== $chatbot->id, 404);

        $data = $request->validate([
            'tables'   => ['required', 'array', 'min:1'],
            'tables.*' => ['string'],
        ]);

        $connection->update([
            'tables' => array_values(array_unique([...$connection->tables, ...$data['tables']])),
        ]);

        $this->sync->sync($connection);

        return response()->json($connection->fresh());
    }

    public function destroy(Request $request, Chatbot $chatbot, DatabaseConnection $connection): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);
        abort_if($connection->chatbot_id !== $chatbot->id, 404);

        $connection->delete();

        return response()->json(['deleted' => true]);
    }

    private function validateCredentials(Request $request): array
    {
        return $request->validate([
            'driver'   => ['required', 'string', 'in:mysql,pgsql'],
            'host'     => ['required', 'string', 'max:255'],
            'port'     => ['required', 'integer', 'min:1', 'max:65535'],
            'database' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255'],
            'password' => ['nullable','max:255'],
        ]);
    }
}   
