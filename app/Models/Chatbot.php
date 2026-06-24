<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Chatbot extends Model
{
    protected $fillable = [
        'user_id', 'name', 'description', 'instructions',
        'allow_general_knowledge', 'public_key', 'status',
    ];

    protected $casts = ['allow_general_knowledge' => 'boolean'];

    protected static function booted(): void
    {
        static::creating(function (Chatbot $chatbot) {
            $chatbot->public_key ??= (string) Str::ulid();
            $chatbot->status ??= 'active';
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function databaseConnections(): HasMany
    {
        return $this->hasMany(DatabaseConnection::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function getSystemPrompt(): string
    {
        $parts = [
            "You are a helpful AI assistant for \"{$this->name}\".",
            "\nFormat every response in Markdown: use headings or bold for key labels, bullet/numbered lists for "
                . "steps or multiple items, and tables when presenting tabular or row-based data (e.g. records "
                . "pulled from a database). Keep prose paragraphs short.",
        ];

        if ($this->description) {
            $parts[] = $this->description;
        }

        if ($this->instructions) {
            $parts[] = "\nAdditional instructions from the chatbot owner — follow these closely:\n{$this->instructions}";
        }

        $docs = $this->documents()->where('status', 'processed')->get();

        if ($docs->isNotEmpty()) {
            $parts[] = "\nUse the following reference documents to answer questions accurately:";

            $budget = 6000;
            foreach ($docs as $doc) {
                if ($budget <= 0) break;
                $text    = substr($doc->extracted_text ?? '', 0, $budget);
                $budget -= strlen($text);
                $parts[] = "\n--- Document: {$doc->original_name} ---\n{$text}";
            }

            if (!$this->instructions) {
                $parts[] = $this->allow_general_knowledge
                    ? "\nPrefer the documents above when they cover the question. If a question goes beyond "
                        . "what the documents cover, answer it using your own general knowledge instead of refusing — "
                        . "just don't contradict the documents."
                    : "\nOnly answer using the documents above. If the answer isn't in the documents, say you don't "
                        . "have that information — do not use outside knowledge or make anything up.";
            }
        }

        return implode("\n", $parts);
    }
}
