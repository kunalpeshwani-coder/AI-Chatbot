<x-guest-layout>
    <x-slot name="heading">{{ __('Create your account') }}</x-slot>
    <x-slot name="subheading">{{ __('Set up your AI chatbot in minutes') }}</x-slot>

    <form method="POST" action="{{ route('register') }}">
        @csrf

        <!-- Name -->
        <div>
            <x-input-label for="name" :value="__('Name')" :light="true" />
            <x-text-input id="name" class="block mt-1 w-full" type="text" name="name" :value="old('name')" required autofocus autocomplete="name" :light="true" />
            <x-input-error :messages="$errors->get('name')" class="mt-2" :light="true" />
        </div>

        <!-- Email Address -->
        <div class="mt-4">
            <x-input-label for="email" :value="__('Email')" :light="true" />
            <x-text-input id="email" class="block mt-1 w-full" type="email" name="email" :value="old('email')" required autocomplete="username" :light="true" />
            <x-input-error :messages="$errors->get('email')" class="mt-2" :light="true" />
        </div>

        <!-- Company Name -->
        <div class="mt-4">
            <x-input-label for="company_name" :value="__('Company Name')" :light="true" />
            <x-text-input id="company_name" class="block mt-1 w-full" type="text" name="company_name" :value="old('company_name')" required autocomplete="organization" :light="true" />
            <x-input-error :messages="$errors->get('company_name')" class="mt-2" :light="true" />
        </div>

        <!-- Password -->
        <div class="mt-4">
            <x-input-label for="password" :value="__('Password')" :light="true" />

            <x-text-input id="password" class="block mt-1 w-full"
                            type="password"
                            name="password"
                            required autocomplete="new-password" :light="true" />

            <x-input-error :messages="$errors->get('password')" class="mt-2" :light="true" />
        </div>

        <!-- Confirm Password -->
        <div class="mt-4">
            <x-input-label for="password_confirmation" :value="__('Confirm Password')" :light="true" />

            <x-text-input id="password_confirmation" class="block mt-1 w-full"
                            type="password"
                            name="password_confirmation" required autocomplete="new-password" :light="true" />

            <x-input-error :messages="$errors->get('password_confirmation')" class="mt-2" :light="true" />
        </div>

        <div class="flex flex-col gap-3 mt-8">
            <x-primary-button class="w-full justify-center" :flat="true">
                {{ __('Register') }}
            </x-primary-button>

            <a href="{{ route('login') }}"
               class="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white rounded-xl font-semibold text-sm text-navy-700 hover:bg-navy-700/5 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 transition ease-in-out duration-150">
                <span class="font-normal">{{ __('Already registered?') }}</span> {{ __('Log In') }}
            </a>
        </div>
    </form>
</x-guest-layout>
