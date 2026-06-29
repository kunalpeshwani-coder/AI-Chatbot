<?php

namespace App\Services;

class SsrfGuard
{
    // Rejects hostnames/IPs that resolve to private, loopback, or link-local addresses —
    // stops clients from pointing the DB-connection or URL-scraper fields at internal
    // infrastructure (e.g. 169.254.169.254 cloud metadata, 127.0.0.1, 10.x/192.168.x).
    public static function assertSafeHost(string $host): void
    {
        // Local/dev environments routinely connect to a DB on the same machine (127.0.0.1, localhost) —
        // only enforce the private-range block where it matters: against real client deployments.
        if (app()->environment('local', 'testing')) {
            return;
        }

        $host = trim($host);

        if ($host === '' || strtolower($host) === 'localhost') {
            throw new \InvalidArgumentException('That host is not allowed.');
        }

        $ips = filter_var($host, FILTER_VALIDATE_IP)
            ? [$host]
            : (gethostbynamel($host) ?: []);

        if (empty($ips)) {
            throw new \InvalidArgumentException("Could not resolve host \"{$host}\".");
        }

        foreach ($ips as $ip) {
            $public = filter_var(
                $ip,
                FILTER_VALIDATE_IP,
                FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
            );

            if ($public === false) {
                throw new \InvalidArgumentException(
                    "Host \"{$host}\" resolves to a private/internal address and cannot be used.",
                );
            }
        }
    }

    public static function assertSafeUrl(string $url): void
    {
        $host = parse_url($url, PHP_URL_HOST);

        if (!$host) {
            throw new \InvalidArgumentException('Invalid URL.');
        }

        self::assertSafeHost($host);
    }
}
