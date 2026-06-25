<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    use HasFactory;

    protected $fillable = ['list_id', 'title', 'description', 'due_date', 'position'];
    protected $casts = ['due_date' => 'date:Y-m-d'];

    public function list() { return $this->belongsTo(BoardList::class, 'list_id'); }
    public function tags() { return $this->belongsToMany(Tag::class, 'card_tag'); }
    public function members() { return $this->belongsToMany(User::class, 'card_user'); }
}
