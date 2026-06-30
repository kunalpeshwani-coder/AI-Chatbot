@props(['messages', 'light' => false])

@if ($messages)
    <ul {{ $attributes->merge(['class' => $light ? 'text-sm text-red-600 space-y-1' : 'text-sm text-red-400 space-y-1']) }}>
        @foreach ((array) $messages as $message)
            <li>{{ $message }}</li>
        @endforeach
    </ul>
@endif
