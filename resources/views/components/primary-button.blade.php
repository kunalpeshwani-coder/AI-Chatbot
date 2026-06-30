@props(['flat' => false])

<button {{ $attributes->merge(['type' => 'submit', 'class' => 'inline-flex items-center justify-center px-5 py-2.5 bg-gold-600 border border-transparent rounded-xl font-semibold text-sm text-white hover:bg-gold-500 focus:bg-gold-500 active:bg-gold-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-navy-900 transition ease-in-out duration-150 ' . ($flat ? '' : 'shadow-md shadow-black/30')]) }}>
    {{ $slot }}
</button>
