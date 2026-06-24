<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use Illuminate\Http\JsonResponse;

class DomainController extends Controller
{
    // All users — list active domains (for domain picker)
    public function index(): JsonResponse
    {
        $domains = Domain::withCount(['documents', 'conversations'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json($domains);
    }
}
