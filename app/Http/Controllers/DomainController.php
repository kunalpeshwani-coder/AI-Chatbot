<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DomainController extends Controller
{
    // All users — list active domains (for domain picker)
    public function index(): JsonResponse
    {
        $domains = Domain::withCount(['documents', 'conversations'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json($domains);
    }

    // Admin — list all domains including inactive
    public function adminIndex(): JsonResponse
    {
        $domains = Domain::withCount(['documents', 'conversations'])
            ->orderBy('name')
            ->get();

        return response()->json($domains);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'icon'        => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $domain = Domain::create([...$data, 'created_by' => $request->user()->id]);

        return response()->json($domain->loadCount('documents'), 201);
    }

    public function update(Request $request, Domain $domain): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:100'],
            'icon'        => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $domain->update($data);

        return response()->json($domain->loadCount('documents'));
    }

    public function destroy(Domain $domain): JsonResponse
    {
        $domain->delete();

        return response()->json(['deleted' => true]);
    }
}
