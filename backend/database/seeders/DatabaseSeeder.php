<?php

namespace Database\Seeders;

use App\Models\Board;
use App\Models\BoardList;
use App\Models\Card;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Demo user
        $user = User::firstOrCreate(
            ['email' => 'demo@forge2.dev'],
            ['name' => 'Mehul (Demo)', 'password' => Hash::make('password')]
        );

        // Tags
        $tagData = [
            ['name' => 'bug',      'color' => '#ef4444'],
            ['name' => 'feature',  'color' => '#6366f1'],
            ['name' => 'urgent',   'color' => '#f59e0b'],
            ['name' => 'agent',    'color' => '#10b981'],
            ['name' => 'review',   'color' => '#8b5cf6'],
            ['name' => 'infra',    'color' => '#3b82f6'],
        ];
        foreach ($tagData as $t) {
            Tag::firstOrCreate(['name' => $t['name']], ['color' => $t['color']]);
        }
        $tags = Tag::all()->keyBy('name');

        // Demo board: Sprint 1
        $board = Board::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Sprint 1 — Kanban App'],
        );

        if ($board->lists()->count() === 0) {
            $backlog = BoardList::create(['board_id' => $board->id, 'name' => 'Backlog', 'position' => 0]);
            $inprog  = BoardList::create(['board_id' => $board->id, 'name' => 'In Progress', 'position' => 1]);
            $review  = BoardList::create(['board_id' => $board->id, 'name' => 'Review', 'position' => 2]);
            $done    = BoardList::create(['board_id' => $board->id, 'name' => 'Done', 'position' => 3]);

            // Backlog cards
            $c1 = Card::create(['list_id' => $backlog->id, 'title' => 'Setup CI pipeline', 'description' => 'GitHub Actions: composer audit + npm audit + Trivy', 'due_date' => now()->addDays(5), 'position' => 0]);
            $c1->tags()->attach([$tags['infra']->id, $tags['urgent']->id]);

            $c2 = Card::create(['list_id' => $backlog->id, 'title' => 'RAG memory for Hermes', 'description' => 'Qdrant vector DB integration for project doc retrieval', 'due_date' => null, 'position' => 1]);
            $c2->tags()->attach([$tags['feature']->id, $tags['agent']->id]);

            // In Progress cards
            $c3 = Card::create(['list_id' => $inprog->id, 'title' => 'Build Kanban board UI', 'description' => 'React DnD, lists, cards, modals', 'due_date' => now()->addDay(), 'position' => 0]);
            $c3->tags()->attach([$tags['feature']->id]);
            $c3->members()->attach([$user->id]);

            $c4 = Card::create(['list_id' => $inprog->id, 'title' => 'Laravel REST API', 'description' => 'All CRUD endpoints with Sanctum auth', 'due_date' => now(), 'position' => 1]);
            $c4->tags()->attach([$tags['feature']->id, $tags['agent']->id]);
            $c4->members()->attach([$user->id]);

            // Review cards
            $c5 = Card::create(['list_id' => $review->id, 'title' => 'Model router with failover', 'description' => 'Groq → Gemini → Ollama routing with logging', 'due_date' => now()->subDay(), 'position' => 0]);
            $c5->tags()->attach([$tags['feature']->id, $tags['review']->id]);

            // Done cards
            $c6 = Card::create(['list_id' => $done->id, 'title' => 'Project scaffolding', 'description' => 'Laravel + Vite + folder structure', 'position' => 0]);
            $c6->tags()->attach([$tags['agent']->id]);
            $c7 = Card::create(['list_id' => $done->id, 'title' => 'Database migrations', 'description' => 'Boards, Lists, Cards, Tags, pivot tables', 'position' => 1]);
            $c7->tags()->attach([$tags['infra']->id]);
        }
    }
}
