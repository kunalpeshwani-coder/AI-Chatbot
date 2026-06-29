<?php

namespace App\Services;

class FileSignatureGuard
{
    // Validates the file's actual byte signature against its claimed extension/MIME — Laravel's
    // `mimes:` rule is easy to spoof (rename any file to .pdf and it often still passes), so this
    // is a second, content-based check before the file is parsed or stored long-term.
    public static function assertValid(string $path, string $fileType): void
    {
        $head = file_get_contents($path, false, null, 0, 8) ?: '';

        $valid = match (strtolower($fileType)) {
            'pdf'         => str_starts_with($head, '%PDF-'),
            'docx', 'xlsx' => str_starts_with($head, "PK\x03\x04"),
            'xls'         => str_starts_with($head, "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"),
            'txt', 'md'   => self::looksLikeText($path),
            default       => true,
        };

        if (!$valid) {
            throw new \InvalidArgumentException(
                "The uploaded file's content doesn't match its \".{$fileType}\" extension.",
            );
        }
    }

    private static function looksLikeText(string $path): bool
    {
        $sample = file_get_contents($path, false, null, 0, 2048) ?: '';

        // A handful of non-printable/control bytes can be legitimate (BOM, smart quotes via
        // multi-byte UTF-8), so only reject if the sample looks predominantly binary.
        $nonText = preg_match_all('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $sample);

        return $sample === '' || $nonText / max(strlen($sample), 1) < 0.05;
    }
}
