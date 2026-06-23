<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="user-name" content="{{ auth()->user()->name }}">
    <meta name="ai-provider" content="{{ config('ai.provider') }}">
    <meta name="preferred-domain-id" content="{{ auth()->user()->domain_id }}">
    <title>AI Chatbot</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-gray-100">

    {{-- Demo host page content — represents the application the widget is embedded into --}}
    <div class="max-w-4xl mx-auto py-16 px-6 text-gray-700">
        <h1 class="text-2xl font-semibold mb-2">Your Application</h1>
        <p class="text-gray-500">The AI chatbot widget is docked in the bottom-right corner.</p>
    </div>

    {{-- Chat widget mounts here — positioned by the widget itself, doesn't affect page layout --}}
    <div id="app"></div>

</body>
</html>
