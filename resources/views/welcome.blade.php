<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="no-scrollbar">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AI Chatbot</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="no-scrollbar min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white flex flex-col">

    {{-- Nav --}}
    <nav class="flex items-center justify-between px-8 py-5">
        <a href="https://journai.us" target="_blank" rel="noopener noreferrer">
            <img src="/journai-logo.svg" alt="JournAI" class="h-7 w-auto">
        </a>

        <div class="flex items-center gap-3">
            @auth
                <a href="{{ route('chat') }}"
                   class="px-4 py-2 bg-gold-600 hover:bg-gold-500 rounded-lg text-sm font-medium transition">
                    Go to Chat &rarr;
                </a>
            @endauth
        </div>
    </nav>

    {{-- Hero --}}
    <main class="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-600/15 border border-gold-700 text-gold-300 text-xs font-medium mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse"></span>
            Powered by OpenAI &bull; Claude &bull; Gemini
        </div>

        <h1 class="text-5xl sm:text-6xl font-bold tracking-tight mb-5 leading-tight">
            Chat with <span class="gold-gradient-text">AI</span>,<br>your way.
        </h1>

        <p class="text-navy-300 text-lg max-w-xl mb-10">
            A configurable AI chatbot that works with multiple providers.
            Choose your model, start a conversation, and let AI do the rest.
        </p>

        @auth
            <a href="{{ route('chat') }}"
               class="inline-flex items-center gap-2 px-7 py-3.5 bg-gold-600 hover:bg-gold-500 rounded-xl text-base font-semibold transition shadow-lg shadow-black/40">
                Open Chatbot &rarr;
            </a>
        @else
            <div class="flex flex-col sm:flex-row items-center gap-4">
                <a href="{{ route('register') }}"
                   class="inline-flex items-center gap-2 px-7 py-3.5 bg-gold-600 hover:bg-gold-500 rounded-xl text-base font-semibold transition shadow-lg shadow-black/40">
                    Get Started &mdash; it&rsquo;s free
                </a>
                <a href="{{ route('login') }}"
                   class="inline-flex items-center gap-2 px-7 py-3.5 bg-gold-600 hover:bg-gold-500 rounded-xl text-base font-semibold transition shadow-lg shadow-black/40">
                    Log In
                </a>
            </div>
        @endauth
    </main>

    {{-- Feature cards --}}
    <section class="max-w-4xl mx-auto w-full px-6 pb-24 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="rounded-xl bg-white/5 border border-white/10 p-5">
            <div class="text-2xl mb-3">🤖</div>
            <h3 class="font-semibold mb-1">Multiple AI Providers</h3>
            <p class="text-navy-300 text-sm">Switch between OpenAI, Anthropic Claude, and Google Gemini with a single config change.</p>
        </div>
        <div class="rounded-xl bg-white/5 border border-white/10 p-5">
            <div class="text-2xl mb-3">💬</div>
            <h3 class="font-semibold mb-1">Conversation History</h3>
            <p class="text-navy-300 text-sm">All your conversations are saved so you can pick up right where you left off.</p>
        </div>
        <div class="rounded-xl bg-white/5 border border-white/10 p-5">
            <div class="text-2xl mb-3">⚡</div>
            <h3 class="font-semibold mb-1">Fast &amp; Simple</h3>
            <p class="text-navy-300 text-sm">Built with Laravel and React for a clean, responsive experience.</p>
        </div>
    </section>

</body>
</html>
