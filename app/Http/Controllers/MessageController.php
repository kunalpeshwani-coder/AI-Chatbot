<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(private AIService $ai) {}

    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        abort_if($conversation->user_id !== $request->user()->id, 403);

        return response()->json($conversation->messages);
    }

    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        abort_if($conversation->user_id !== $request->user()->id, 403);

        $request->validate(['content' => ['required', 'string', 'max:10000']]);

        // Save the user's message
        $userMessage = $conversation->messages()->create([
            'role'    => 'user',
            'content' => $request->content,
        ]);

        // Build conversation history
        $history = $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => ['role' => $m->role, 'content' => $m->content])
            ->toArray();

        // Prepend domain system prompt if this conversation belongs to a domain
        if ($conversation->domain_id) {
            $domain = $conversation->load('domain')->domain;
            if ($domain) {
                array_unshift($history, [
                    'role'    => 'system',
                    'content' => $domain->getSystemPrompt(),
                ]);
            }
        }

        // Keep replies short and scannable — this is a small chat widget, not a document
        array_unshift($history, [
            'role'    => 'system',
            'content' => 'Keep replies brief and to the point — a few short sentences or a tight bullet list. '
                . 'Avoid long explanations unless the user explicitly asks for more detail.',
        ]);

        // Get AI reply
        $reply = $this->ai->chat($history);

        // Save assistant reply
        $assistantMessage = $conversation->messages()->create([
            'role'        => 'assistant',
            'content'     => $reply['content'] ?: '⚠️ Sorry, something went wrong generating a response. Please try again.',
            'tokens_used' => $reply['tokens'] ?? null,
        ]);

        // Auto-title after first exchange
        if ($conversation->messages()->count() === 2) {
            $conversation->update(['title' => $this->generateTitle($request->content)]);
        }

        return response()->json([
            'user'         => $userMessage,
            'assistant'    => $assistantMessage,
            'conversation' => $conversation->fresh(['domain:id,name,icon']),
        ]);
    }

    private function generateTitle(string $firstMessage): string
    {
        $words = explode(' ', trim($firstMessage));
        $title = implode(' ', array_slice($words, 0, 6));

        return strlen($title) > 50 ? substr($title, 0, 50) . '…' : $title;
    }
}
