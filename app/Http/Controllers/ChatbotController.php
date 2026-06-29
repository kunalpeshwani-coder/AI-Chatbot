<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Chatbot;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatbotController extends Controller
{
    public function __construct(private AIService $ai) {}

    // All of the current client's chatbots
    public function index(Request $request): JsonResponse
    {
        $chatbots = $request->user()->chatbots()->withCount('documents')->latest()->get();

        return response()->json($chatbots);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $chatbot = $request->user()->chatbots()->create($data);

        AuditLog::record('chatbot.created', $chatbot);

        return response()->json($chatbot->loadCount('documents'), 201);
    }

    public function update(Request $request, Chatbot $chatbot): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'name'                     => ['sometimes', 'string', 'max:100'],
            'description'              => ['nullable', 'string', 'max:1000'],
            'instructions'             => ['nullable', 'string', 'max:2000'],
            'allow_general_knowledge'  => ['sometimes', 'boolean'],
        ]);

        $chatbot->update($data);

        return response()->json($chatbot->loadCount('documents'));
    }

    public function destroy(Request $request, Chatbot $chatbot): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);

        AuditLog::record('chatbot.deleted', $chatbot, ['name' => $chatbot->name]);

        $chatbot->delete();

        return response()->json(['deleted' => true]);
    }

    // Ephemeral test chat against one of the client's chatbots, from inside the dashboard.
    // Not persisted to the database — purely for previewing how the bot will respond.
    public function testMessage(Request $request, Chatbot $chatbot): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'messages'           => ['required', 'array', 'min:1'],
            'messages.*.role'    => ['required', 'string', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:10000'],
        ]);

        $lastUserMessage = collect($data['messages'])->where('role', 'user')->last()['content'] ?? null;

        $history = array_merge(
            [['role' => 'system', 'content' => $chatbot->getSystemPrompt($lastUserMessage)]],
            $data['messages'],
        );

        $reply = $this->ai->chat($history);

        return response()->json(['content' => $reply['content']]);
    }
}
