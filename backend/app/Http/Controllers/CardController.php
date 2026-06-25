<?php

namespace App\Http\Controllers;

use App\Models\BoardList;
use App\Models\Card;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\Request;

class CardController extends Controller
{
    public function index(BoardList $list)
    {
        return response()->json($list->cards()->with(['tags', 'members'])->get());
    }

    public function store(Request $request, BoardList $list)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date'    => 'nullable|date',
        ]);

        $position = $list->cards()->max('position') + 1;
        $card = $list->cards()->create([...$data, 'position' => $position]);

        return response()->json($card->load(['tags', 'members']), 201);
    }

    public function show(Card $card)
    {
        return response()->json($card->load(['tags', 'members', 'list.board']));
    }

    public function update(Request $request, Card $card)
    {
        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'due_date'    => 'nullable|date',
            'list_id'     => 'sometimes|exists:lists,id',
            'position'    => 'sometimes|integer',
        ]);

        $card->update($data);

        return response()->json($card->load(['tags', 'members']));
    }

    public function destroy(Card $card)
    {
        $card->delete();
        return response()->json(['message' => 'Card deleted']);
    }

    // Tag attachment
    public function attachTag(Request $request, Card $card)
    {
        $data = $request->validate(['tag_id' => 'required|exists:tags,id']);
        $card->tags()->syncWithoutDetaching([$data['tag_id']]);
        return response()->json($card->load(['tags', 'members']));
    }

    public function detachTag(Card $card, Tag $tag)
    {
        $card->tags()->detach($tag->id);
        return response()->json($card->load(['tags', 'members']));
    }

    // Member assignment
    public function attachMember(Request $request, Card $card)
    {
        $data = $request->validate(['user_id' => 'required|exists:users,id']);
        $card->members()->syncWithoutDetaching([$data['user_id']]);
        return response()->json($card->load(['tags', 'members']));
    }

    public function detachMember(Card $card, User $user)
    {
        $card->members()->detach($user->id);
        return response()->json($card->load(['tags', 'members']));
    }
}
