<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Chatbot;
use App\Models\Document;
use App\Services\DocumentService;
use App\Services\FileSignatureGuard;
use App\Services\RagService;
use App\Services\SsrfGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChatbotDocumentController extends Controller
{
    public function __construct(private DocumentService $extractor, private RagService $rag) {}

    public function index(Request $request, Chatbot $chatbot): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);

        return response()->json($chatbot->documents()->latest()->get());
    }

    public function store(Request $request, Chatbot $chatbot): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);

        $request->validate([
            'file' => ['required', 'file', 'max:20480', 'mimes:txt,pdf,docx,md,xlsx,xls'],
        ]);

        $file     = $request->file('file');
        $fileType = strtolower($file->getClientOriginalExtension());

        try {
            FileSignatureGuard::assertValid($file->getRealPath(), $fileType);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $stored = $file->store("documents/chatbot_{$chatbot->id}", 'local');

        $document = $chatbot->documents()->create([
            'original_name' => $file->getClientOriginalName(),
            'file_path'     => $stored,
            'file_type'     => $fileType,
            'size_bytes'    => $file->getSize(),
            'status'        => 'pending',
        ]);

        AuditLog::record('document.uploaded', $document, ['chatbot_id' => $chatbot->id, 'file_type' => $fileType]);

        try {
            $absolutePath = Storage::disk('local')->path($stored);
            $text = $this->extractor->extractText($absolutePath, $fileType);

            $document->update([
                'extracted_text' => $text,
                'status'         => $text !== '' ? 'processed' : 'failed',
            ]);

            if ($document->status === 'processed') {
                $this->rag->indexDocument($document);
            }
        } catch (\Throwable) {
            $document->update(['status' => 'failed']);
        }

        return response()->json($document, 201);
    }

    // Adds a website URL as a knowledge source — fetches and extracts its text content
    public function storeUrl(Request $request, Chatbot $chatbot): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'url' => ['required', 'url', 'max:2048'],
        ]);

        try {
            SsrfGuard::assertSafeUrl($data['url']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $document = $chatbot->documents()->create([
            'original_name' => $data['url'],
            'source_url'     => $data['url'],
            'file_type'      => 'url',
            'size_bytes'     => 0,
            'status'         => 'pending',
        ]);

        AuditLog::record('document.url_added', $document, ['chatbot_id' => $chatbot->id, 'url' => $data['url']]);

        try {
            $text = $this->extractor->extractFromUrl($data['url']);

            $document->update([
                'extracted_text' => $text,
                'status'         => $text !== '' ? 'processed' : 'failed',
            ]);

            if ($document->status === 'processed') {
                $this->rag->indexDocument($document);
            }
        } catch (\Throwable) {
            $document->update(['status' => 'failed']);
        }

        return response()->json($document, 201);
    }

    public function destroy(Request $request, Chatbot $chatbot, Document $document): JsonResponse
    {
        abort_if($chatbot->user_id !== $request->user()->id, 403);
        abort_if($document->chatbot_id !== $chatbot->id, 404);

        AuditLog::record('document.deleted', $document, ['chatbot_id' => $chatbot->id, 'original_name' => $document->original_name]);

        if ($document->file_path) {
            Storage::disk('local')->delete($document->file_path);
        }
        $document->delete();

        return response()->json(['deleted' => true]);
    }
}
