<x-guest-layout>
    <x-slot name="heading">{{ __('Welcome back') }}</x-slot>
    <x-slot name="subheading">{{ __('Log in to manage your chatbots') }}</x-slot>

    <!-- Session Status -->
    <x-auth-session-status class="mb-4" :status="session('status')" />

    <form method="POST" action="{{ route('login') }}">
        @csrf

        <!-- Email Address -->
        <div>
            <x-input-label for="email" :value="__('Email')" :light="true" />
            <x-text-input id="email" class="block mt-1 w-full" type="email" name="email" :value="old('email')" required autofocus autocomplete="username" :light="true" />
            <x-input-error :messages="$errors->get('email')" class="mt-2" :light="true" />
        </div>

        <!-- Password -->
        <div class="mt-4">
            <x-input-label for="password" :value="__('Password')" :light="true" />

            <x-text-input id="password" class="block mt-1 w-full"
                            type="password"
                            name="password"
                            required autocomplete="current-password" :light="true" />

            <x-input-error :messages="$errors->get('password')" class="mt-2" :light="true" />
        </div>

        <!-- Remember Me + Forgot Password -->
        <div class="flex items-center justify-between mt-4">
            <label for="remember_me" class="inline-flex items-center">
                <input id="remember_me" type="checkbox" class="rounded border-navy-300 text-gold-600 shadow-sm focus:ring-gold-500" name="remember">
                <span class="ms-2 text-sm text-navy-600">{{ __('Remember me') }}</span>
            </label>

            @if (Route::has('password.request'))
                <a class="underline text-sm text-navy-500 hover:text-navy-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500" href="{{ route('password.request') }}">
                    {{ __('Forgot your password?') }}
                </a>
            @endif
        </div>

        <div class="flex flex-col gap-3 mt-4">
            <x-primary-button class="w-full justify-center">
                {{ __('Log in') }}
            </x-primary-button>

            <a href="{{ route('register') }}"
               class="w-full inline-flex items-center justify-center px-5 py-2.5 bg-white border border-gold-600 rounded-xl font-semibold text-sm text-gold-700 hover:bg-gold-600/10 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 transition ease-in-out duration-150">
                {{ __('Sign Up') }}
            </a>
        </div>
    </form>
</x-guest-layout>
