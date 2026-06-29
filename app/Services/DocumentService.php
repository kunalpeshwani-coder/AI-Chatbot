<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

class DocumentService
{
    public function extractText(string $absolutePath, string $fileType): string
    {
        return match (strtolower($fileType)) {
            'txt', 'md'   => $this->extractFromText($absolutePath),
            'pdf'         => $this->extractFromPdf($absolutePath),
            'docx'        => $this->extractFromDocx($absolutePath),
            'xlsx', 'xls' => $this->extractFromExcel($absolutePath),
            default       => '',
        };
    }

    // Fetches a web page and strips it down to its visible text content
    public function extractFromUrl(string $url): string
    {
        try {
            SsrfGuard::assertSafeUrl($url);

            $response = Http::timeout(20)->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (compatible; AIChatbotKnowledgeBaseBot/1.0)',
            ])->get($url);

            if ($response->failed()) {
                return '';
            }

            $html = $response->body();

            // Drop script/style blocks entirely, then strip remaining tags
            $html = preg_replace('/<(script|style)\b[^>]*>.*?<\/\1>/is', ' ', $html);
            $text = strip_tags($html ?? '');
            $text = html_entity_decode($text, ENT_QUOTES);
            $text = preg_replace('/[ \t]+/', ' ', $text ?? '');
            $text = preg_replace('/\n{3,}/', "\n\n", $text ?? '');

            return trim($text ?? '');
        } catch (\Throwable) {
            return '';
        }
    }

    private function extractFromText(string $path): string
    {
        return file_get_contents($path) ?: '';
    }

    private function extractFromPdf(string $path): string
    {
        if (!class_exists(\Smalot\PdfParser\Parser::class)) {
            return '';
        }

        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf    = $parser->parseFile($path);
            return $pdf->getText();
        } catch (\Throwable) {
            return '';
        }
    }

    private function extractFromDocx(string $path): string
    {
        // DOCX files are ZIP archives containing word/document.xml
        try {
            $zip = new \ZipArchive();
            if ($zip->open($path) !== true) return '';

            $xml = $zip->getFromName('word/document.xml');
            $zip->close();

            if (!$xml) return '';

            // Strip XML tags, preserve whitespace between elements
            $text = preg_replace('/<w:p[ >]/', "\n<w:p>", $xml);
            $text = strip_tags($text ?? '');
            $text = preg_replace('/\s{2,}/', ' ', $text ?? '');

            return trim($text ?? '');
        } catch (\Throwable) {
            return '';
        }
    }

    private function extractFromExcel(string $path): string
    {
        if (!class_exists(\PhpOffice\PhpSpreadsheet\IOFactory::class)) {
            return '';
        }

        try {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($path);
            $lines       = [];

            foreach ($spreadsheet->getAllSheets() as $sheet) {
                $lines[] = "--- Sheet: {$sheet->getTitle()} ---";

                foreach ($sheet->toArray(null, true, true, false) as $row) {
                    $cells = array_map(fn($cell) => trim((string) $cell), $row);
                    $cells = array_filter($cells, fn($cell) => $cell !== '');

                    if ($cells) {
                        $lines[] = implode(' | ', $cells);
                    }
                }
            }

            return trim(implode("\n", $lines));
        } catch (\Throwable) {
            return '';
        }
    }
}
