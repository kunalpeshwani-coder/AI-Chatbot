<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Domain extends Model
{
    protected $fillable = ['name', 'icon', 'description', 'is_active', 'created_by'];

    protected $casts = ['is_active' => 'boolean'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function getSystemPrompt(): string
    {
        $parts = ["You are a helpful AI assistant specialized in the domain of \"{$this->name}\"."];

        if ($this->description) {
            $parts[] = $this->description;
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

            $parts[] = "\nPrefer the documents above when they cover the question. If a question goes beyond "
                . "what the documents cover, answer it using your own general knowledge instead of refusing — "
                . "just don't contradict the documents.";
        }

        return implode("\n", $parts);
    }
}
