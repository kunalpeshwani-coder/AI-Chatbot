<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    // The widget routes must stay embeddable in an iframe on arbitrary client websites, so they
    // get a relaxed frame-ancestors policy instead of the strict one applied to the rest of the app.
    private const WIDGET_PREFIXES = ['widget/'];

    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $isWidget = collect(self::WIDGET_PREFIXES)->contains(fn ($prefix) => $request->is("{$prefix}*"));

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        if ($isWidget) {
            // Embeddable anywhere — the widget's whole purpose is being framed on client sites.
            $response->headers->set('Content-Security-Policy', "frame-ancestors *");
        } else {
            $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
            $response->headers->set('Content-Security-Policy', "frame-ancestors 'self'");
        }

        if ($request->secure() || app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
