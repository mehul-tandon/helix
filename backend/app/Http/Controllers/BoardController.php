<?php

namespace App\Http\Controllers;

use App\Models\Board;
use Illuminate\Http\Request;

class BoardController extends Controller
{
    public function index(Request $request)
    {
        $boards = $request->user()->boards()->withCount(['lists'])->get();

        // Append cards_count manually
        $boards->each(function ($board) {
            $board->cards_count = $board->lists()->withCount('cards')->get()->sum('cards_count');
        });

        return response()->json($boards);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);

        $board = $request->user()->boards()->create($data);

        return response()->json($board, 201);
    }

    public function show(Request $request, Board $board)
    {
        $this->authorizeBoard($board, $request->user());

        $board->load(['lists.cards.tags', 'lists.cards.members']);

        return response()->json($board);
    }

    public function update(Request $request, Board $board)
    {
        $this->authorizeBoard($board, $request->user());

        $data = $request->validate(['name' => 'required|string|max:255']);
        $board->update($data);

        return response()->json($board);
    }

    public function destroy(Request $request, Board $board)
    {
        $this->authorizeBoard($board, $request->user());
        $board->delete();

        return response()->json(['message' => 'Board deleted']);
    }

    private function authorizeBoard(Board $board, $user)
    {
        if ($board->user_id !== $user->id) abort(403);
    }
}
