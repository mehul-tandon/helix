<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\BoardList;
use Illuminate\Http\Request;

class ListController extends Controller
{
    public function index(Request $request, Board $board)
    {
        $this->authorizeBoard($board, $request->user());
        $lists = $board->lists()->with(['cards.tags', 'cards.members'])->get();
        return response()->json($lists);
    }

    public function store(Request $request, Board $board)
    {
        $this->authorizeBoard($board, $request->user());
        $data = $request->validate(['name' => 'required|string|max:255']);

        $position = $board->lists()->max('position') + 1;
        $list = $board->lists()->create(['name' => $data['name'], 'position' => $position]);

        return response()->json($list->load('cards'), 201);
    }

    public function update(Request $request, BoardList $list)
    {
        $data = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'position' => 'sometimes|integer',
        ]);
        $list->update($data);

        return response()->json($list);
    }

    public function destroy(BoardList $list)
    {
        $list->delete();
        return response()->json(['message' => 'List deleted']);
    }

    private function authorizeBoard(Board $board, $user)
    {
        if ($board->user_id !== $user->id) abort(403);
    }
}
