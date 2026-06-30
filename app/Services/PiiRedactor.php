<?php

namespace App\Services;

class PiiRedactor
{
    // Strips common PII out of knowledge-base content (synced DB rows, uploaded documents,
    // scraped URLs) before it's stored and, by extension, before it's ever included in a prompt
    // sent to a third-party AI provider. This is ingestion-time redaction — it runs once when
    // content enters the knowledge base, not per chat message, so the AI provider simply never
    // receives the raw values for fields matched below.
    public static function redact(string $text): string
    {
        $text = self::redactEmails($text);
        $text = self::redactCardNumbers($text);
        $text = self::redactSsns($text);
        $text = self::redactPhoneNumbers($text);

        return $text;
    }

    private static function redactEmails(string $text): string
    {
        return preg_replace('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', '[redacted email]', $text) ?? $text;
    }

    private static function redactSsns(string $text): string
    {
        return preg_replace('/\b\d{3}-\d{2}-\d{4}\b/', '[redacted SSN]', $text) ?? $text;
    }

    private static function redactCardNumbers(string $text): string
    {
        return preg_replace_callback('/\b(?:\d[ -]?){13,19}\b/', function ($matches) {
            $digits = preg_replace('/\D/', '', $matches[0]);

            return self::passesLuhn($digits) ? '[redacted card number]' : $matches[0];
        }, $text) ?? $text;
    }

    // Conservative on purpose: only matches clearly phone-shaped patterns (with separators) to
    // avoid mangling order IDs, table row numbers, or other unrelated digit sequences.
    private static function redactPhoneNumbers(string $text): string
    {
        return preg_replace(
            '/\b(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]\d{3}[ -]\d{4}\b/',
            '[redacted phone number]',
            $text,
        ) ?? $text;
    }

    private static function passesLuhn(string $digits): bool
    {
        if (strlen($digits) < 13 || strlen($digits) > 19) {
            return false;
        }

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
