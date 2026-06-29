<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use GuzzleHttp\Client as GuzzleClient;
use OpenAI;

class AIService
{
    /**
     * Send a message history to the configured AI provider and get a reply.
     *
     * @param  array  $messages  [['role' => 'user'|'assistant', 'content' => '...']]
     * @return array  ['content' => string, 'tokens' => int|null]
     */
    public function chat(array $messages): array
    {
        // Allow enough time for slow free-tier models plus retries (default PHP limit is 30s)
        set_time_limit(180);

        $provider = config('ai.provider', 'openai');

        return match ($provider) {
            'openai' => $this->chatWithOpenAI($messages),
            'claude' => $this->chatWithClaude($messages),
            'gemini' => $this->chatWithGemini($messages),
            default  => throw new \InvalidArgumentException("Unknown AI provider: {$provider}"),
        };
    }

    private function chatWithOpenAI(array $messages): array
    {
        $apiKey = config('ai.openai.api_key');

        if (empty($apiKey) || str_contains($apiKey, 'your-') || str_contains($apiKey, '-here')) {
            return $this->missingKeyResponse('OpenAI', 'OPENAI_API_KEY');
        }

        $retries = 3;

        for ($attempt = 1; $attempt <= $retries; $attempt++) {
            try {
                $payload = json_encode([
                    'model'      => config('ai.openai.model', 'gpt-4o-mini'),
                    'messages'   => $messages,
                    'max_tokens' => 500,
                ]);

                $context = stream_context_create([
                    'http' => [
                        'method'        => 'POST',
                        'header'        => implode("\r\n", [
                            'Content-Type: application/json',
                            "Authorization: Bearer {$apiKey}",
                            'HTTP-Referer: http://localhost',
                            'X-Title: AI Chatbot',
                        ]),
                        'content'       => $payload,
                        'timeout'       => 45,
                        'ignore_errors' => true,
                    ],
                ]);

                $baseUrl = rtrim(config('ai.openai.base_url', 'https://api.openai.com/v1'), '/');
                $body    = file_get_contents("{$baseUrl}/chat/completions", false, $context);

                if ($body === false) {
                    return $this->apiErrorResponse('OpenAI', 'Could not connect to OpenAI API.');
                }

                $data = json_decode($body, true);

                // Rate limit (OpenAI format or OpenRouter's numeric 429) — wait and retry
                $errCode = $data['error']['code'] ?? null;
                if ($errCode === 'rate_limit_exceeded' || $errCode === 429) {
                    $retryAfter = $data['error']['metadata']['retry_after_seconds'] ?? (5 * $attempt);
                    if ($attempt < $retries) {
                        sleep((int) ceil($retryAfter));
                        continue;
                    }
                    return $this->apiErrorResponse('OpenAI', 'Rate limit exceeded. Please wait a moment and try again.');
                }

                if (isset($data['error'])) {
                    return $this->apiErrorResponse('OpenAI', $data['error']['message'] ?? 'Unknown error');
                }

                $content = $data['choices'][0]['message']['content'] ?? null;

                if ($content === null || $content === '') {
                    if ($attempt < $retries) {
                        continue;
                    }
                    return $this->apiErrorResponse('OpenAI', 'Received an empty response from the model.');
                }

                return [
                    'content' => $content,
                    'tokens'  => $data['usage']['total_tokens'] ?? null,
                ];

            } catch (\Throwable $e) {
                return $this->apiErrorResponse('OpenAI', $e->getMessage());
            }
        }

        return $this->apiErrorResponse('OpenAI', 'Failed after retries.');
    }

    private function chatWithClaude(array $messages): array
    {
        $apiKey = config('ai.claude.api_key');

        if (empty($apiKey) || str_contains($apiKey, 'your-') || str_contains($apiKey, '-here')) {
            return $this->missingKeyResponse('Claude', 'ANTHROPIC_API_KEY');
        }

        try {
            // Claude separates the system prompt from the conversation messages.
            // Combine all system messages (there may be more than one) into one block.
            $systemParts = [];
            $filtered    = [];
            foreach ($messages as $msg) {
                if ($msg['role'] === 'system') {
                    $systemParts[] = $msg['content'];
                } else {
                    $filtered[] = $msg;
                }
            }
            $system = $systemParts ? implode("\n\n", $systemParts) : null;

            $body = [
                'model'      => config('ai.claude.model', 'claude-sonnet-4-6'),
                'max_tokens' => 500,
                'messages'   => $filtered,
            ];
            if ($system) {
                $body['system'] = $system;
            }

            $response = Http::timeout(55)->withHeaders([
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->post('https://api.anthropic.com/v1/messages', $body);

            if ($response->failed()) {
                $err = $response->json('error.message') ?? $response->body();
                return $this->apiErrorResponse('Claude', $err);
            }

            $data = $response->json();

            return [
                'content' => $data['content'][0]['text'] ?? 'No response from Claude.',
                'tokens'  => ($data['usage']['input_tokens'] ?? 0) + ($data['usage']['output_tokens'] ?? 0),
            ];
        } catch (\Throwable $e) {
            return $this->apiErrorResponse('Claude', $e->getMessage());
        }
    }

    private function chatWithGemini(array $messages): array
    {
        $apiKey = config('ai.gemini.api_key');

        if (empty($apiKey) || str_contains($apiKey, 'your-') || str_contains($apiKey, '-here')) {
            return $this->missingKeyResponse('Gemini', 'GEMINI_API_KEY');
        }

        try {
            // Gemini uses a different message format: 'user'/'model' roles and parts[].text,
            // with system instructions passed separately via systemInstruction.
            $systemParts = array_column(array_filter($messages, fn($m) => $m['role'] === 'system'), 'content');

            $contents = array_map(fn($msg) => [
                'role'  => $msg['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $msg['content']]],
            ], array_filter($messages, fn($m) => $m['role'] !== 'system'));

            $model      = config('ai.gemini.model', 'gemini-2.0-flash');
            $url        = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
            $requestBody = ['contents' => array_values($contents)];

            if ($systemParts) {
                $requestBody['systemInstruction'] = [
                    'parts' => [['text' => implode("\n\n", $systemParts)]],
                ];
            }

            $payload = json_encode($requestBody);

            // Use file_get_contents with stream context (no curl needed)
            $context = stream_context_create([
                'http' => [
                    'method'        => 'POST',
                    'header'        => "Content-Type: application/json\r\n",
                    'content'       => $payload,
                    'timeout'       => 55,
                    'ignore_errors' => true,
                ],
            ]);

            $body = file_get_contents($url, false, $context);

            if ($body === false) {
                return $this->apiErrorResponse('Gemini', 'Could not connect to Gemini API.');
            }

            $data = json_decode($body, true);

            if (isset($data['error'])) {
                return $this->apiErrorResponse('Gemini', $data['error']['message'] ?? 'Unknown error');
            }

            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No response from Gemini.';

            return [
                'content' => $text,
                'tokens'  => null,
            ];
        } catch (\Throwable $e) {
            return $this->apiErrorResponse('Gemini', $e->getMessage());
        }
    }

    private function missingKeyResponse(string $providerName, string $envKey): array
    {
        return [
            'content' => "⚠️ No API key configured for {$providerName}. Please set `{$envKey}` in your `.env` file.",
            'tokens'  => null,
        ];
    }

    private function apiErrorResponse(string $providerName, string $error): array
    {
        return [
            'content' => "⚠️ {$providerName} API error: {$error}",
            'tokens'  => null,
        ];
    }
}
