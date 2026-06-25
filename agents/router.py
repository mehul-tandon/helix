"""
Model router with task-type routing and provider failover.
Used by both Hermes and OpenClaw agents.

Usage:
    from router import chat
    response = chat("plan", messages=[{"role":"user","content":"..."}], keys=os.environ)
"""

import json
import os
import time
import requests

# ─── Route Map ────────────────────────────────────────────────────────────────
# Each task type has an ordered list of (provider, model) fallbacks.
# The router tries them in order and returns the first successful response.

ROUTES = {
    "plan":    [("groq",   "openai/gpt-oss-120b"),     ("gemini", "gemini-2.5-flash")],
    "code":    [("ollama", "qwen2.5-coder"),            ("groq",   "llama-3.3-70b-versatile")],
    "summary": [("gemini", "gemini-2.5-flash"),         ("ollama", "qwen2.5-coder")],
    "review":  [("gemini", "gemini-2.5-flash"),         ("groq",   "llama-3.3-70b-versatile")],
}

# ─── Endpoints ────────────────────────────────────────────────────────────────
ENDPOINTS = {
    "groq":   ("https://api.groq.com/openai/v1/chat/completions",                           "GROQ_API_KEY"),
    "gemini": ("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",  "GEMINI_API_KEY"),
    "ollama": ("http://localhost:11434/v1/chat/completions",                                None),
}

# ─── Logging ──────────────────────────────────────────────────────────────────
LOG_PATH = os.path.join(os.path.dirname(__file__), "../../agent-log/events.jsonl")

def log_call(agent: str, task_type: str, provider: str, model: str,
             status: str, duration_ms: int, error: str = None) -> None:
    """Append a structured event to the shared agent-log."""
    event = {
        "agent":    agent,
        "task":     task_type,
        "provider": provider,
        "model":    model,
        "status":   status,
        "duration_ms": duration_ms,
        "ts":       time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    if error:
        event["error"] = error

    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, "a") as f:
        f.write(json.dumps(event) + "\n")


# ─── Core Router ──────────────────────────────────────────────────────────────
def chat(task_type: str, messages: list, keys: dict, agent: str = "unknown",
         timeout: int = 20) -> dict:
    """
    Route a chat request to the best available provider for the given task type.

    Args:
        task_type: One of "plan", "code", "summary", "review"
        messages:  OpenAI-compatible messages list
        keys:      Dict of env vars (GROQ_API_KEY, GEMINI_API_KEY, etc.)
        agent:     Name of the calling agent (for logging)
        timeout:   Request timeout in seconds per provider

    Returns:
        OpenAI-compatible response dict from the first succeeding provider.

    Raises:
        RuntimeError: If all providers are exhausted.
    """
    route = ROUTES.get(task_type, ROUTES["code"])
    errors = []

    for provider, model in route:
        url, key_name = ENDPOINTS[provider]
        headers = {"Content-Type": "application/json"}
        if key_name:
            api_key = keys.get(key_name)
            if not api_key:
                errors.append(f"{provider}: missing {key_name}")
                continue
            headers["Authorization"] = f"Bearer {api_key}"

        start = time.monotonic()
        try:
            r = requests.post(
                url,
                json={"model": model, "messages": messages},
                headers=headers,
                timeout=timeout,
            )
            duration_ms = int((time.monotonic() - start) * 1000)

            if r.status_code == 200:
                log_call(agent, task_type, provider, model, "completed", duration_ms)
                return r.json()

            err = f"{provider}/{model}: HTTP {r.status_code}"
            errors.append(err)
            log_call(agent, task_type, provider, model, "failed", duration_ms, err)

        except requests.RequestException as e:
            duration_ms = int((time.monotonic() - start) * 1000)
            err = f"{provider}/{model}: {type(e).__name__}"
            errors.append(err)
            log_call(agent, task_type, provider, model, "failed", duration_ms, err)
            continue

    raise RuntimeError(
        f"All providers exhausted for task_type={task_type!r}. "
        f"Errors: {'; '.join(errors)}"
    )


# ─── CLI Test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    task = sys.argv[1] if len(sys.argv) > 1 else "plan"
    msg  = sys.argv[2] if len(sys.argv) > 2 else "Say hello in one sentence."

    print(f"Testing router: task_type={task!r}")
    try:
        result = chat(task, [{"role": "user", "content": msg}], keys=os.environ, agent="test")
        print("Response:", result["choices"][0]["message"]["content"])
    except RuntimeError as e:
        print("Error:", e)
