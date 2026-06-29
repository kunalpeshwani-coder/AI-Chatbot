<?php

namespace App\Services;

class OutputFilter
{
    // Backstop against the prompt-level safety guardrail being bypassed (jailbreak, owner
    // instruction override, model error) — scans the *outgoing* reply text itself and redacts
    // anything that looks like a payment card number, SSN, or other ID before it reaches the user.
    public static function sanitize(string $content): string
    {
        $patterns = [
            // Credit/debit card numbers (13-19 digits, optionally grouped by spaces/dashes)
            '/\b(?:\d[ -]?){13,19}\b/' => '[redacted card number]',
            // US Social Security Numbers
            '/\b\d{3}-\d{2}-\d{4}\b/' => '[redacted SSN]',
        ];

        foreach ($patterns as $pattern => $replacement) {
            $content = preg_replace_callback($pattern, function ($matches) use ($replacement) {
                $digits = preg_replace('/\D/', '', $matches[0]);

                // Luhn check for the card pattern avoids false-positives on long non-card numbers
                // (order IDs, phone numbers, etc.) — only redact digit runs that actually pass it.
                if (strlen($digits) >= 13 && strlen($digits) <= 19 && self::passesLuhn($digits)) {
                    return $replacement;
                }

                if (strlen($digits) === 9 && str_contains($matches[0], '-')) {
                    return $replacement;
                }

                return $matches[0];
            }, $content);
        }

        return $content;
    }

    private static function passesLuhn(string $digits): bool
    {
        $sum = 0;
        $alt = false;

        for ($i = strlen($digits) - 1; $i >= 0; $i--) {
            $n = (int) $digits[$i];

            if ($alt) {
                $n *= 2;
                if ($n > 9) {
                    $n -= 9;
                }
            }

            $sum += $n;
            $alt = !$alt;
        }

        return $sum % 10 === 0;
    }
}
