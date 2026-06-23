<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Domain;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function __construct(private DocumentService $extractor) {}

    public function index(Domain $domain): JsonResponse
    {
        return response()->json($domain->documents()->latest()->get());
    }

    public function store(Request $request, Domain $domain): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:20480', 'mimes:txt,pdf,docx,md'],
        ]);

        $file     = $request->file('file');
        $fileType = strtolower($file->getClientOriginalExtension());
        $stored   = $file->store("documents/domain_{$domain->id}", 'local');

        $document = $domain->documents()->create([
            'original_name' => $file->getClientOriginalName(),
            'file_path'     => $stored,
            'file_type'     => $fileType,
            'size_bytes'    => $file->getSize(),
            'status'        => 'pending',
        ]);

        // Extract text immediately (for a learning project, synchronous is fine)
        try {
            $absolutePath = Storage::disk('local')->path($stored);
            $text = $this->extractor->extractText($absolutePath, $fileType);

            $document->update([
                'extracted_text' => $text,
                'status'         => 'processed',
            ]);
        } catch (\Throwable $e) {
            $document->update(['status' => 'failed']);
        }

        return response()->json($document, 201);
    }

    public function destroy(Domain $domain, Document $document): JsonResponse
    {
        abort_if($document->domain_id !== $domain->id, 404);

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return response()->json(['deleted' => true]);
    }
}
