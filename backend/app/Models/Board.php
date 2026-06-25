<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Board extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'name'];

    public function user() { return $this->belongsTo(User::class); }
    public function lists() { return $this->hasMany(BoardList::class, 'board_id')->orderBy('position'); }

    public function getListsCountAttribute() { return $this->lists()->count(); }
    public function getCardsCountAttribute() {
        return $this->lists()->withCount('cards')->get()->sum('cards_count');
    }
}
