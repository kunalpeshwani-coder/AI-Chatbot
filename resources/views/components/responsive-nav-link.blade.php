@props(['active'])

@php
$classes = ($active ?? false)
            ? 'block w-full ps-3 pe-4 py-2 border-l-4 border-gold-400 text-start text-base font-medium text-gold-300 bg-gold-600/10 focus:outline-none focus:text-gold-200 focus:bg-gold-600/20 focus:border-gold-700 transition duration-150 ease-in-out'
            : 'block w-full ps-3 pe-4 py-2 border-l-4 border-transparent text-start text-base font-medium text-navy-300 hover:text-white hover:bg-white/5 hover:border-white/20 focus:outline-none focus:text-white focus:bg-white/5 focus:border-white/20 transition duration-150 ease-in-out';
@endphp

<a {{ $attributes->merge(['class' => $classes]) }}>
    {{ $slot }}
</a>
