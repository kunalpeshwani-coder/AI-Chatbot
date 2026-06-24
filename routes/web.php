<?php

use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\ChatbotDatabaseController;
use App\Http\Controllers\ChatbotDocumentController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\DomainController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WidgetController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
})->name('home');

Route::get('/chat', function () {
    // Admins have no use for the chat widget — send them to their dashboard instead.
    if (auth()->user()->is_admin) {
        return redirect('/admin');
    }
    return view('chat');
})->middleware(['auth'])->name('chat');

Route::get('/admin', function () {
    return view('admin');
})->middleware(['auth', 'admin'])->name('admin.dashboard');

Route::get('/dashboard', function () {
    // Admins manage the platform from /admin, not the client dashboard.
    if (auth()->user()->is_admin) {
        return redirect('/admin');
    }
    return view('client-dashboard');
})->middleware(['auth'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Chat API — uses session auth (same as web, no Sanctum needed)
Route::middleware('auth')->prefix('api')->group(function () {
    // Domains (read — all authenticated users)
    Route::get('/domains', [DomainController::class, 'index']);

    // Conversations
    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::post('/conversations', [ConversationController::class, 'store']);
    Route::delete('/conversations/{conversation}', [ConversationController::class, 'destroy']);
    Route::get('/conversations/{conversation}/messages', [MessageController::class, 'index']);
    Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store']);

    // Client's own chatbots — create multiple, manage knowledge base, test, get embed snippets
    Route::get('/my-chatbots', [ChatbotController::class, 'index']);
    Route::post('/my-chatbots', [ChatbotController::class, 'store']);
    Route::put('/my-chatbots/{chatbot}', [ChatbotController::class, 'update']);
    Route::delete('/my-chatbots/{chatbot}', [ChatbotController::class, 'destroy']);
    Route::post('/my-chatbots/{chatbot}/test-message', [ChatbotController::class, 'testMessage']);
    Route::get('/my-chatbots/{chatbot}/documents', [ChatbotDocumentController::class, 'index']);
    Route::post('/my-chatbots/{chatbot}/documents', [ChatbotDocumentController::class, 'store']);
    Route::post('/my-chatbots/{chatbot}/documents/url', [ChatbotDocumentController::class, 'storeUrl']);
    Route::delete('/my-chatbots/{chatbot}/documents/{document}', [ChatbotDocumentController::class, 'destroy']);

    // Client's chatbots — connect a database as a knowledge source
    Route::get('/my-chatbots/{chatbot}/database-connections', [ChatbotDatabaseController::class, 'index']);
    Route::post('/my-chatbots/{chatbot}/database-connections/test', [ChatbotDatabaseController::class, 'testConnection']);
    Route::post('/my-chatbots/{chatbot}/database-connections', [ChatbotDatabaseController::class, 'store']);
    Route::post('/my-chatbots/{chatbot}/database-connections/{connection}/sync', [ChatbotDatabaseController::class, 'resync']);
    Route::delete('/my-chatbots/{chatbot}/database-connections/{connection}', [ChatbotDatabaseController::class, 'destroy']);

    // Admin-only routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/clients', [ClientController::class, 'index']);
        Route::get('/clients/{client}', [ClientController::class, 'show']);
        Route::put('/clients/{client}/package', [ClientController::class, 'updatePackage']);
    });
});

// Public embeddable widget — no auth, runs inside an iframe on the client's own website
Route::get('/widget/{publicKey}', [WidgetController::class, 'show']);
Route::post('/widget/{publicKey}/messages', [WidgetController::class, 'sendMessage']);

require __DIR__.'/auth.php';
