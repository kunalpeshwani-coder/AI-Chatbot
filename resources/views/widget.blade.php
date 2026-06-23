<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="chatbot-name" content="{{ $chatbot->name }}">
    <meta name="chatbot-public-key" content="{{ $chatbot->public_key }}">
    <title>AI Chatbot</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/widget.jsx'])
</head>
<body class="h-screen w-screen overflow-hidden bg-navy-900">
    <div id="widget-app" class="h-full w-full"></div>
</body>
</html>
