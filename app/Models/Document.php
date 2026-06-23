<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    protected $fillable = [
        'domain_id', 'chatbot_id', 'original_name', 'source_url', 'file_path',
        'file_type', 'extracted_text', 'status', 'size_bytes',
    ];

    protected $hidden = ['extracted_text', 'file_path'];

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function chatbot(): BelongsTo
    {
        return $this->belongsTo(Chatbot::class);
    }
}
