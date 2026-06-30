<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

#[Signature('app:ensure-admin-user')]
#[Description('Creates or promotes an admin user from ADMIN_EMAIL/ADMIN_PASSWORD env vars. Safe to run on every boot.')]
class EnsureAdminUser extends Command
{
    public function handle(): int
    {
        $email    = config('app.admin_email');
        $password = config('app.admin_password');

        if (!$email || !$password) {
            $this->info('ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin bootstrap.');
            return self::SUCCESS;
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            // Already exists — just make sure it's an admin. Never overwrite an existing
            // password on every boot, that would silently undo a password the admin changed.
            if (!$user->is_admin) {
                $user->update(['is_admin' => true]);
                $this->info("Promoted existing user {$email} to admin.");
            } else {
                $this->info("{$email} is already an admin — nothing to do.");
            }
            return self::SUCCESS;
        }

        User::create([
            'name'     => config('app.admin_name', 'Admin'),
            'email'    => $email,
            'password' => Hash::make($password),
            'is_admin' => true,
        ]);

        $this->info("Created admin user {$email}.");

        return self::SUCCESS;
    }
}
