<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $domainId = $request->query('domain_id');

        $conversations = $request->user()
            ->conversations()
            ->with('domain:id,name,icon')
            ->withCount('messages')
            ->when($domainId, fn($q) => $q->where('domain_id', $domainId))
            ->latest()
            ->get();

        return response()->json($conversations);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'domain_id' => ['nullable', 'exists:domains,id'],
        ]);

        $conversation = $request->user()->conversations()->create([
            'domain_id'   => $data['domain_id'] ?? null,
            'title'       => 'New Conversation',
            'ai_provider' => config('ai.provider', 'openai'),
        ]);

        return response()->json($conversation->load('domain:id,name,icon'), 201);
    }

    public function destroy(Request $request, Conversation $conversation): JsonResponse
    {
        abort_if($conversation->user_id !== $request->user()->id, 403);

        $conversation->delete();

        return response()->json(['deleted' => true]);
    }
}
