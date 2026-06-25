<?php

use App\Http\Controllers\AgentLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BoardController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\ListController;
use App\Http\Controllers\TagController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Boards
    Route::apiResource('boards', BoardController::class);

    // Lists (nested under boards for store/index; standalone for update/destroy)
    Route::get('boards/{board}/lists',  [ListController::class, 'index']);
    Route::post('boards/{board}/lists', [ListController::class, 'store']);
    Route::put('lists/{list}',          [ListController::class, 'update']);
    Route::delete('lists/{list}',       [ListController::class, 'destroy']);

    // Cards
    Route::get('lists/{list}/cards',    [CardController::class, 'index']);
    Route::post('lists/{list}/cards',   [CardController::class, 'store']);
    Route::get('cards/{card}',          [CardController::class, 'show']);
    Route::put('cards/{card}',          [CardController::class, 'update']);
    Route::delete('cards/{card}',       [CardController::class, 'destroy']);

    // Card → Tags
    Route::post('cards/{card}/tags',           [CardController::class, 'attachTag']);
    Route::delete('cards/{card}/tags/{tag}',   [CardController::class, 'detachTag']);

    // Card → Members
    Route::post('cards/{card}/members',          [CardController::class, 'attachMember']);
    Route::delete('cards/{card}/members/{user}', [CardController::class, 'detachMember']);

    // Tags
    Route::get('tags',         [TagController::class, 'index']);
    Route::post('tags',        [TagController::class, 'store']);
    Route::delete('tags/{tag}',[TagController::class, 'destroy']);

    // Agent log (audit page)
    Route::get('agent-log', [AgentLogController::class, 'index']);
});
