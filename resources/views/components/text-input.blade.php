@props(['disabled' => false])

<input @disabled($disabled) {{ $attributes->merge(['class' => 'bg-navy-900 border-white/10 text-white placeholder-navy-300 focus:border-gold-500 focus:ring-gold-500 rounded-xl shadow-sm py-2.5']) }}>
