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

    // Fetches a web page and strips it down to its main visible text content — deliberately
    // excludes nav/header/footer/sidebar boilerplate so the knowledge base reflects the actual
    // article/page content rather than menu links, which used to crowd out the real text.
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

            return $this->extractMainContent($response->body() ?? '');
        } catch (\Throwable) {
            return '';
        }
    }

    private function extractMainContent(string $html): string
    {
        if (trim($html) === '') {
            return '';
        }

        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($html, LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_clear_errors();

        $xpath = new \DOMXPath($dom);

        // Strip elements that are never the actual content, regardless of where they sit.
        foreach ($xpath->query('//script|//style|//nav|//header|//footer|//aside|//noscript|//form|//iframe') as $node) {
            $node->parentNode?->removeChild($node);
        }

        // Prefer a dedicated content container if the page has one — far less noisy than the
        // whole body, which still includes sidebars/related-content widgets on most sites.
        $content = $xpath->query('//article')->item(0)
            ?? $xpath->query('//main')->item(0)
            ?? $xpath->query('//*[@role="main"]')->item(0)
            ?? $this->largestContentCandidate($xpath)
            ?? $dom->getElementsByTagName('body')->item(0);

        if (!$content) {
            return '';
        }

        $text = $content->textContent;
        $text = html_entity_decode($text, ENT_QUOTES);
        $text = preg_replace('/[ \t]+/', ' ', $text) ?? '';
        $text = preg_replace('/\n\s*\n\s*/', "\n\n", $text) ?? '';

        return trim($text);
    }

    // Many modern sites (Next.js/React builds especially) don't use <article>/<main> at all —
    // their content container is a <div> with a hashed CSS-module class name that still contains
    // a recognizable word like "article" or "content". Among all such candidates, the real
    // content block is reliably the one with the most text (sidebars/widgets are comparatively
    // short), which also happens to sidestep nav menus that don't match these keywords at all.
    private function largestContentCandidate(\DOMXPath $xpath): ?\DOMNode
    {
        $candidates = $xpath->query(
            "//*[contains(translate(@class, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'article') "
            . "or contains(translate(@class, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'post-content') "
            . "or contains(translate(@class, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'entry-content') "
            . "or contains(translate(@class, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'post-body') "
            . "or contains(translate(@class, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'maincontent')]",
        );

        if (!$candidates || $candidates->length === 0) {
            return null;
        }

        $nodes = iterator_to_array($candidates);

        // Layout wrappers tend to also match these keywords (e.g. "ArticlePageLayout") and
        // contain the *real* content node plus sidebar/related-content widgets — so prefer the
        // most specific (deepest) match: drop any candidate that is an ancestor of another one.
        $leafNodes = array_filter($nodes, function ($node) use ($nodes) {
            foreach ($nodes as $other) {
                if ($other !== $node && $this->isAncestorOf($node, $other)) {
                    return false;
                }
            }
            return true;
        });

        $best       = null;
        $bestLength = 0;

        foreach ($leafNodes as $node) {
            $length = strlen(trim($node->textContent));

            if ($length <= 200 || $length <= $bestLength) {
                continue;
            }

            // Nav menus are almost entirely link text; real article prose isn't.
            if ($this->linkDensity($node) > 0.3) {
                continue;
            }

            $best       = $node;
            $bestLength = $length;
        }

        return $best;
    }

    private function isAncestorOf(\DOMNode $ancestor, \DOMNode $node): bool
    {
        for ($parent = $node->parentNode; $parent !== null; $parent = $parent->parentNode) {
            if ($parent === $ancestor) {
                return true;
            }
        }
        return false;
    }

    private function linkDensity(\DOMNode $node): float
    {
        $totalLength = strlen(trim($node->textContent));

        if ($totalLength === 0) {
            return 1.0;
        }

        $linkLength = 0;
        $links      = $node instanceof \DOMElement
            ? $node->getElementsByTagName('a')
            : [];

        foreach ($links as $a) {
            $linkLength += strlen(trim($a->textContent));
        }

        return $linkLength / $totalLength;
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
