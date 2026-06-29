<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DatabaseConnection extends Model
{
    protected $fillable = [
        'chatbot_id', 'driver', 'host', 'port', 'database', 'username',
        'password', 'tables', 'excluded_columns', 'status', 'error_message', 'last_synced_at',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'tables'           => 'array',
        'excluded_columns' => 'array',
        'password'         => 'encrypted',
        'last_synced_at'   => 'datetime',
    ];

    public function chatbot(): BelongsTo
    {
        return $this->belongsTo(Chatbot::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
