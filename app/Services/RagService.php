<?php

namespace App\Services;

use App\Models\Chatbot;
use App\Models\Document;
use App\Models\DocumentChunk;

class RagService
{
    public function __construct(private EmbeddingService $embeddings) {}

    // (Re)builds the chunk index for a single document. Safe to call repeatedly — e.g. on resync,
    // it just throws away the old chunks and rebuilds. No-ops quietly if embeddings aren't
    // configured/reachable, so the caller's existing whole-document fallback still applies.
    public function indexDocument(Document $document): void
    {
        if (!$this->embeddings->isAvailable()) {
            return;
        }

        $document->chunks()->delete();

        $pieces = $this->embeddings->chunk($document->extracted_text ?? '');

        if (empty($pieces)) {
            return;
        }

        try {
            $vectors = $this->embeddings->embedBatch($pieces);
        } catch (\Throwable) {
            return;
        }

        foreach ($pieces as $i => $content) {
            $document->chunks()->create([
                'chatbot_id'  => $document->chatbot_id,
                'chunk_index' => $i,
                'content'     => $content,
                'embedding'   => $vectors[$i] ?? [],
            ]);
        }
    }

    // Returns the top-K chunks most relevant to the user's latest message, ranked by cosine
    // similarity. Returns [] if RAG isn't available/indexed yet — caller falls back to raw dump.
    public function retrieve(Chatbot $chatbot, string $query, int $topK = 6): array
    {
        if (!$this->embeddings->isAvailable() || trim($query) === '') {
            return [];
        }

        $chunks = DocumentChunk::where('chatbot_id', $chatbot->id)->get(['id', 'content', 'embedding']);

        if ($chunks->isEmpty()) {
            return [];
        }

        try {
            $queryVector = $this->embeddings->embedQuery($query);
        } catch (\Throwable) {
            return [];
        }

        if (empty($queryVector)) {
            return [];
        }

        return $chunks
            ->map(fn ($chunk) => [
                'chunk' => $chunk,
                'score' => EmbeddingService::cosineSimilarity($queryVector, $chunk->embedding ?? []),
            ])
            ->sortByDesc('score')
            ->take($topK)
            ->pluck('chunk')
            ->all();
    }
}
