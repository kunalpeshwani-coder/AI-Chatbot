<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class EmbeddingService
{
    private const MODEL          = 'text-embedding-3-small';
    private const CHUNK_SIZE     = 900;
    private const CHUNK_OVERLAP  = 150;

    // RAG only works against OpenAI's embeddings endpoint regardless of which provider answers
    // the chat itself — so it needs its own key check independent of the configured chat provider.
    public function isAvailable(): bool
    {
        $key = config('ai.embeddings.api_key');

        return !empty($key) && !str_contains($key, 'your-') && !str_contains($key, '-here');
    }

    // Splits text into overlapping fixed-size windows so context isn't lost at chunk boundaries.
    public function chunk(string $text): array
    {
        $text = trim(preg_replace('/\s+/', ' ', $text) ?? '');

        if ($text === '') {
            return [];
        }

        $chunks = [];
        $length = strlen($text);
        $start  = 0;

        while ($start < $length) {
            $end      = min($start + self::CHUNK_SIZE, $length);
            $chunks[] = substr($text, $start, $end - $start);

            if ($end >= $length) {
                break;
            }

            $start = $end - self::CHUNK_OVERLAP;
        }

        return $chunks;
    }

    // Embeds a batch of texts in one API call. Throws on failure — callers decide the fallback.
    public function embedBatch(array $texts): array
    {
        if (empty($texts)) {
            return [];
        }

        $apiKey  = config('ai.embeddings.api_key');
        $baseUrl = rtrim(config('ai.embeddings.base_url', 'https://api.openai.com/v1'), '/');

        $response = Http::timeout(60)->withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type'  => 'application/json',
        ])->post("{$baseUrl}/embeddings", [
            'model' => self::MODEL,
            'input' => $texts,
        ]);

        if ($response->failed()) {
            throw new \RuntimeException(
                'Embedding request failed: ' . ($response->json('error.message') ?? $response->body()),
            );
        }

        $data = $response->json('data', []);
        usort($data, fn ($a, $b) => $a['index'] <=> $b['index']);

        return array_map(fn ($d) => $d['embedding'], $data);
    }

    public function embedQuery(string $text): array
    {
        return $this->embedBatch([$text])[0] ?? [];
    }

    public static function cosineSimilarity(array $a, array $b): float
    {
        $len = min(count($a), count($b));

        if ($len === 0) {
            return 0.0;
        }

        $dot = $normA = $normB = 0.0;

        for ($i = 0; $i < $len; $i++) {
            $dot   += $a[$i] * $b[$i];
            $normA += $a[$i] * $a[$i];
            $normB += $b[$i] * $b[$i];
        }

        if ($normA <= 0 || $normB <= 0) {
            return 0.0;
        }

        return $dot / (sqrt($normA) * sqrt($normB));
    }
}
