<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AgentLogController extends Controller
{
    private string $logPath;

    public function __construct()
    {
        $this->logPath = base_path('../agent-log/events.jsonl');
    }

    public function index()
    {
        if (! file_exists($this->logPath)) {
            return response()->json(['events' => [], 'stats' => $this->emptyStats()]);
        }

        $lines  = file($this->logPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $events = array_map(fn($l) => json_decode($l, true), $lines);
        $events = array_filter($events);          // drop malformed lines
        $events = array_values($events);

        $stats = $this->buildStats($events);

        return response()->json(['events' => $events, 'stats' => $stats]);
    }

    private function buildStats(array $events): array
    {
        $completed = count(array_filter($events, fn($e) => ($e['status'] ?? '') === 'completed'));
        $failed    = count(array_filter($events, fn($e) => ($e['status'] ?? '') === 'failed'));

        $models = [];
        foreach ($events as $e) {
            $m = $e['model'] ?? 'unknown';
            $models[$m] = ($models[$m] ?? 0) + 1;
        }

        $durations = array_filter(array_column($events, 'duration_ms'));
        $avgMs     = count($durations) ? (int)(array_sum($durations) / count($durations)) : 0;

        return compact('completed', 'failed', 'models', 'avgMs');
    }

    private function emptyStats(): array
    {
        return ['completed' => 0, 'failed' => 0, 'models' => [], 'avgMs' => 0];
    }
}
