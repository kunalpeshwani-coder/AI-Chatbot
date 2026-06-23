<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    // List all clients (non-admin users) with their usage details
    public function index(): JsonResponse
    {
        $clients = User::where('is_admin', false)
            ->withCount('conversations')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'package', 'created_at']);

        return response()->json($clients);
    }

    // Update a client's package — only "free" is available right now
    public function updatePackage(Request $request, User $client): JsonResponse
    {
        abort_if($client->is_admin, 404);

        $data = $request->validate([
            'package' => ['required', 'string', 'in:free'],
        ]);

        $client->update($data);

        return response()->json($client->loadCount('conversations'));
    }
}
