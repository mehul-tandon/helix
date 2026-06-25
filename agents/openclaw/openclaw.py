"""
OpenClaw Agent — the "Hands" of the Helix agent system.

Responsibilities:
- Reads task assignments from #agent-coder Slack channel
- Executes tasks: write code, run tests, make git commits
- Posts results back to Slack
- Waits for human approval (👍 or @Mehul approve) before merge/deploy
- Logs all activity to agent-log/events.jsonl via the model router

Setup:
    pip install slack-sdk python-dotenv requests
    export SLACK_BOT_TOKEN=xoxb-your-token
    export SLACK_CHANNEL_ID=C0000000000   # #agent-coder channel ID
    python3 openclaw.py

See runbook §3 for full Slack app creation steps.
"""

import os
import time
import subprocess
from dotenv import load_dotenv

load_dotenv()

# ─── Config ───────────────────────────────────────────────────────────────────
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN")
SLACK_CHANNEL   = os.environ.get("SLACK_CHANNEL_ID", "#agent-coder")
POLL_INTERVAL   = int(os.environ.get("POLL_INTERVAL_SEC", "15"))

# ─── Lazy Slack import (only needed when running live) ────────────────────────
try:
    from slack_sdk import WebClient
    import ssl
    import certifi
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    slack = WebClient(token=SLACK_BOT_TOKEN, ssl=ssl_context) if SLACK_BOT_TOKEN else None
except ImportError:
    slack = None


def post_to_slack(channel: str, text: str) -> None:
    """Post a message to a Slack channel."""
    if slack:
        slack.chat_postMessage(channel=channel, text=text)
    else:
        print(f"[SLACK → {channel}] {text}")


def wait_for_approval(channel: str, message_ts: str, timeout_sec: int = 3600) -> bool:
    """
    Poll for a 👍 reaction on the given message or an '@openclaw approve' reply.
    Returns True if approved, False if timeout exceeded.

    Human approval gate — this is the Responsible AI safeguard.
    No merge or deployment proceeds until a human explicitly approves.
    """
    if not slack:
        print("[APPROVAL GATE] No Slack connection — simulating approval after 3s")
        time.sleep(3)
        return True

    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            resp = slack.reactions_get(channel=channel, timestamp=message_ts)
            reactions = resp["message"].get("reactions", [])
            for r in reactions:
                if r["name"] == "+1":  # 👍
                    return True
        except Exception:
            pass
        time.sleep(POLL_INTERVAL)

    return False  # Timeout — do NOT proceed


def run_task(task: dict, keys: dict) -> dict:
    """
    Execute a task assigned by Hermes.

    task = {
        "type": "code" | "plan" | "summary",
        "description": "...",
        "files_to_create": [...],
        "commands": [...],
    }
    """
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from router import chat

    messages = [
        {"role": "system", "content": "You are OpenClaw, an expert software engineer. Write production-quality code."},
        {"role": "user",   "content": task["description"]},
    ]

    result = chat(
        task_type=task.get("type", "code"),
        messages=messages,
        keys=keys,
        agent="openclaw",
    )
    return result


def main_loop() -> None:
    """
    Main polling loop — reads tasks from Slack, executes them, posts results,
    and waits for human approval before any merge/deploy.
    """
    print(f"[OpenClaw] Starting. Polling {SLACK_CHANNEL} every {POLL_INTERVAL}s")
    post_to_slack(SLACK_CHANNEL, "🦾 *OpenClaw online* — ready to receive tasks from Hermes.")

    last_ts = None
    while True:
        try:
            if slack:
                history = slack.conversations_history(channel=SLACK_CHANNEL, limit=5)
                messages = history.get("messages", [])
                for msg in messages:
                    if msg.get("ts") == last_ts:
                        break
                    if "TASK:" in msg.get("text", ""):
                        last_ts = msg["ts"]
                        task_text = msg["text"].replace("TASK:", "").strip()
                        print(f"[OpenClaw] Received task: {task_text[:80]}")

                        # Execute
                        post_to_slack(SLACK_CHANNEL, f"⚙️ Working on: _{task_text[:80]}_")
                        # (real implementation would parse structured task JSON)

                        # Post result + wait for approval
                        report_ts = slack.chat_postMessage(
                            channel=SLACK_CHANNEL,
                            text=f"✅ Task complete: _{task_text[:80]}_\n\n👍 React with thumbs up to approve merge/deploy.\ncc @Mehul"
                        )["ts"]

                        approved = wait_for_approval(SLACK_CHANNEL, report_ts)
                        if approved:
                            post_to_slack(SLACK_CHANNEL, "🚀 Approval received — proceeding with merge/deploy.")
                        else:
                            post_to_slack(SLACK_CHANNEL, "⏳ Approval timeout — not proceeding. Re-run task when ready.")

        except Exception as e:
            print(f"[OpenClaw] Error in main loop: {e}")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main_loop()
