<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = ['user_id', 'action', 'subject_type', 'subject_id', 'meta', 'ip_address'];

    protected $casts = ['meta' => 'array'];

    public static function record(string $action, ?Model $subject = null, array $meta = []): void
    {
        static::create([
            'user_id'      => request()?->user()?->id,
            'action'       => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id'   => $subject?->getKey(),
            'meta'         => $meta,
            'ip_address'   => request()?->ip(),
        ]);
    }
}
