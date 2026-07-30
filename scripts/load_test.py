"""BiasSense baseline load test: 100 virtual users for 60 seconds.

Uses a persistent requests.Session per virtual user so Windows does not
exhaust ephemeral ports during a sustained high-request-rate run.
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
import threading
import time
from pathlib import Path

import requests


def percentile(values: list[float], percent: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    position = max(0, math.ceil(percent / 100 * len(ordered)) - 1)
    return ordered[position]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:5174/")
    parser.add_argument("--users", type=int, default=100)
    parser.add_argument("--duration", type=int, default=60)
    parser.add_argument("--output", default="test-results/load-test-summary.json")
    args = parser.parse_args()

    deadline = 0.0
    latencies: list[float] = []
    statuses: dict[str, int] = {}
    failures = 0
    lock = threading.Lock()
    start_gate = threading.Barrier(args.users + 1)

    def user() -> None:
        nonlocal failures
        local_latencies: list[float] = []
        local_statuses: dict[str, int] = {}
        local_failures = 0
        session = requests.Session()
        session.headers.update({"User-Agent": "BiasSense-LoadTest/1.0"})
        start_gate.wait()
        while time.perf_counter() < deadline:
            started = time.perf_counter()
            try:
                response = session.get(args.url, timeout=10)
                status = str(response.status_code)
                local_statuses[status] = local_statuses.get(status, 0) + 1
                if response.status_code != 200:
                    local_failures += 1
            except requests.RequestException:
                local_statuses["error"] = local_statuses.get("error", 0) + 1
                local_failures += 1
            local_latencies.append((time.perf_counter() - started) * 1000)
            time.sleep(0.005)
        session.close()
        with lock:
            latencies.extend(local_latencies)
            failures += local_failures
            for status, count in local_statuses.items():
                statuses[status] = statuses.get(status, 0) + count

    threads = [threading.Thread(target=user, daemon=True) for _ in range(args.users)]
    for thread in threads:
        thread.start()
    wall_start = time.perf_counter()
    deadline = wall_start + args.duration
    start_gate.wait()
    for thread in threads:
        thread.join()
    elapsed = time.perf_counter() - wall_start

    total = len(latencies)
    failure_rate = failures / total if total else 1.0
    result = {
        "target": args.url,
        "virtual_users": args.users,
        "configured_duration_seconds": args.duration,
        "actual_duration_seconds": round(elapsed, 3),
        "total_requests": total,
        "requests_per_second": round(total / elapsed, 2) if elapsed else 0,
        "response_time_ms": {
            "min": round(min(latencies), 2) if latencies else 0,
            "average": round(statistics.fmean(latencies), 2) if latencies else 0,
            "p95": round(percentile(latencies, 95), 2),
            "max": round(max(latencies), 2) if latencies else 0,
        },
        "failures": failures,
        "failure_rate": round(failure_rate, 6),
        "statuses": statuses,
        "thresholds": {
            "failure_rate_under_5_percent": failure_rate < 0.05,
            "p95_under_1500_ms": percentile(latencies, 95) < 1500,
        },
    }
    destination = Path(args.output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if all(result["thresholds"].values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
