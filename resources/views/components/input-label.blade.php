@props(['value'])

<label {{ $attributes->merge(['class' => 'block font-medium text-sm text-navy-200']) }}>
    {{ $value ?? $slot }}
</label>
