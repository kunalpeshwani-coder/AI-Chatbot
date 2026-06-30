<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectUsersTo(fn (Request $request) => $request->user()?->is_admin ? '/admin' : '/dashboard');
        $middleware->alias(['admin' => \App\Http\Middleware\AdminMiddleware::class]);
        $middleware->web(append: [\App\Http\Middleware\SecurityHeaders::class]);

        // Render (and most PaaS hosts) terminate TLS at their edge and forward plain HTTP to the
        // container, so Laravel must trust the X-Forwarded-Proto header to know the original
        // request was HTTPS — otherwise it generates http:// asset URLs on an https:// page,
        // which browsers block as mixed content. '*' is safe here: Render's network only lets
        // its own proxy reach the container, so there's no untrusted client that can spoof this.
        $middleware->trustProxies(at: '*', headers: Request::HEADER_X_FORWARDED_FOR
            | Request::HEADER_X_FORWARDED_HOST
            | Request::HEADER_X_FORWARDED_PORT
            | Request::HEADER_X_FORWARDED_PROTO);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
