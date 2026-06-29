<?php

return [
    'provider' => env('AI_PROVIDER', 'openai'),

    'openai' => [
        'api_key'  => env('OPENAI_API_KEY'),
        'model'    => env('OPENAI_MODEL', 'gpt-4o-mini'),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    ],

    'claude' => [
        'api_key' => env('ANTHROPIC_API_KEY'),
        'model'   => env('ANTHROPIC_MODEL', 'claude-sonnet-4-6'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model'   => env('GEMINI_MODEL', 'gemini-1.5-flash'),
    ],

    // RAG embeddings always go through OpenAI's real API, regardless of which provider/base_url
    // is configured for chat (e.g. OpenRouter, which has no embeddings endpoint). Falls back to
    // OPENAI_API_KEY for convenience, but set EMBEDDING_API_KEY separately if that key isn't a
    // genuine OpenAI key.
    'embeddings' => [
        'api_key'  => env('EMBEDDING_API_KEY', env('OPENAI_API_KEY')),
        'base_url' => env('EMBEDDING_BASE_URL', 'https://api.openai.com/v1'),
    ],
];
