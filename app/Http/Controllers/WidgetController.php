<?php

namespace App\Http\Controllers;

use App\Models\Chatbot;
use App\Models\Conversation;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class WidgetController extends Controller
{
    public function __construct(private AIService $ai) {}

    // Renders inside an iframe on the client's own website. Loaded from our origin,
    // so it can use a normal (guest) session to track the anonymous visitor's conversation.
    public function show(string $publicKey): View
    {
        $chatbot = Chatbot::where('public_key', $publicKey)->where('status', 'active')->firstOrFail();

        return view('widget', ['chatbot' => $chatbot]);
    }

    public function sendMessage(Request $request, string $publicKey): JsonResponse
    {
        $chatbot = Chatbot::where('public_key', $publicKey)->where('status', 'active')->firstOrFail();

        $request->validate(['content' => ['required', 'string', 'max:10000']]);

        $sessionKey = "widget_conversation_{$chatbot->public_key}";

        $conversation = Conversation::find($request->session()->get($sessionKey));

        if (!$conversation || $conversation->chatbot_id !== $chatbot->id) {
            $conversation = Conversation::create([
                'chatbot_id'    => $chatbot->id,
                'visitor_token' => $request->session()->getId(),
                'title'         => 'Widget Visitor',
            ]);
            $request->session()->put($sessionKey, $conversation->id);
        }

        $userMessage = $conversation->messages()->create([
            'role'    => 'user',
            'content' => $request->content,
        ]);

        $history = $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => ['role' => $m->role, 'content' => $m->content])
            ->prepend(['role' => 'system', 'content' => $chatbot->getSystemPrompt($request->content)])
            ->toArray();

        $reply = $this->ai->chat($history);

        $assistantMessage = $conversation->messages()->create([
            'role'        => 'assistant',
            'content'     => $reply['content'] ?: '⚠️ Sorry, something went wrong generating a response. Please try again.',
            'tokens_used' => $reply['tokens'] ?? null,
        ]);

        return response()->json([
            'user'      => $userMessage,
            'assistant' => $assistantMessage,
        ]);
    }
}
