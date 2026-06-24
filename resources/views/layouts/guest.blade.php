<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="no-scrollbar font-sans text-white antialiased">
        <div class="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 overflow-hidden">
            {{-- Repeated logo-icon pattern background --}}
            <div class="pointer-events-none select-none absolute inset-0"
                 style="background-image: url('/journai-icon.svg'); background-repeat: repeat; background-size: 70px 70px; opacity: 0.08; mask-image: radial-gradient(circle at center, black 0%, transparent 80%);"></div>

            <a href="/" class="relative z-10 flex flex-col items-center gap-3 mb-8">
                <img src="/journai-logo.svg" alt="JournAI" class="h-9 w-auto">
                <span class="text-xs uppercase tracking-widest text-navy-300">AI Chatbot Platform</span>
            </a>

            <div class="relative z-10 w-full sm:max-w-md px-8 py-8 bg-navy-900/60 border border-white/10 shadow-xl shadow-black/30 rounded-2xl backdrop-blur-sm">
                @isset($heading)
                    <div class="mb-6 text-center">
                        <h1 class="text-xl font-semibold text-white">{{ $heading }}</h1>
                        @isset($subheading)
                            <p class="text-sm text-navy-300 mt-1">{{ $subheading }}</p>
                        @endisset
                    </div>
                @endisset

                {{ $slot }}
            </div>

            <p class="relative z-10 text-xs text-navy-400 mt-8">
                &copy; {{ date('Y') }} JournAI &mdash; All rights reserved.
            </p>
        </div>
    </body>
</html>
