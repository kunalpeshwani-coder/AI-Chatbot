@props(['disabled' => false, 'light' => false])

<input @disabled($disabled) {{ $attributes->merge(['class' => $light
    ? 'bg-white border-navy-200 text-navy-900 placeholder-navy-400 focus:border-gold-500 focus:ring-gold-500 rounded-xl shadow-sm py-2.5'
    : 'bg-navy-900 border-white/10 text-white placeholder-navy-300 focus:border-gold-500 focus:ring-gold-500 rounded-xl shadow-sm py-2.5']) }}>
