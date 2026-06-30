@props(['value', 'light' => false])

<label {{ $attributes->merge(['class' => $light ? 'block font-medium text-sm text-navy-700' : 'block font-medium text-sm text-navy-200']) }}>
    {{ $value ?? $slot }}
</label>
