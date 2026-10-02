<!-- TODO: Rewrite and humanize content from 16-advanced-automation\module-51-production-grade.md -->

# Module 51 — Building Production-Grade Automation

## 1. Chapter Introduction
This module brings together everything you have learned. A production-grade automation script is not just a script that works—it is a script that works reliably, logs its actions, handles errors, validates inputs, manages secrets, and exits with meaningful codes. In this module, we will build a complete production-grade automation tool that follows all the best practices from this book.

## 2. What You Will Learn
- The anatomy of a production-grade Python automation script.
- How to combine logging, error handling, retries, and configuration.
- How to structure automation projects with proper packaging.
- How to add dry-run mode, verbose output, and graceful shutdown.

## 3. Production-Grade Script Template
```python
#!/usr/bin/env python3
"""
Production-Grade Server Health Monitor
Checks server fleet health and generates alerts.

Usage:
    python health_monitor.py --config config.yaml --env production
    python health_monitor.py --config config.yaml --env staging --dry-run
"""
import argparse
import logging
import sys
import os
import yaml
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

# ─── Logging Setup ───────────────────────────────────────────────
def setup_logging(verbose=False):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(f"health_monitor_{datetime.now():%Y%m%d}.log"),
        ]
    )
    return logging.getLogger("health_monitor")

# ─── Configuration ───────────────────────────────────────────────
def load_config(filepath):
    if not os.path.exists(filepath):
        print(f"❌ Config file not found: {filepath}")
        sys.exit(1)
    with open(filepath) as f:
        return yaml.safe_load(f)

# ─── Core Logic ──────────────────────────────────────────────────
def check_server(server, timeout=5):
    try:
        resp = requests.get(f"http://{server['host']}:{server['port']}/health", timeout=timeout)
        return {"server": server["name"], "healthy": resp.status_code == 200}
    except requests.RequestException:
        return {"server": server["name"], "healthy": False}

def run_health_check(config, dry_run=False, logger=None):
    servers = config["servers"]
    if dry_run:
        logger.info(f"[DRY RUN] Would check {len(servers)} servers")
        for s in servers:
            logger.info(f"  → {s['name']} ({s['host']}:{s['port']})")
        return

    logger.info(f"Checking {len(servers)} servers...")
    with ThreadPoolExecutor(max_workers=config.get("max_workers", 10)) as executor:
        futures = [executor.submit(check_server, s) for s in servers]
        results = [f.result() for f in as_completed(futures)]

    unhealthy = [r for r in results if not r["healthy"]]
    if unhealthy:
        logger.warning(f"⚠️ {len(unhealthy)} servers unhealthy:")
        for r in unhealthy:
            logger.warning(f"  🔴 {r['server']}")
        sys.exit(1)
    else:
        logger.info(f"✅ All {len(results)} servers healthy")

# ─── CLI Entry Point ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Production Server Health Monitor")
    parser.add_argument("--config", required=True, help="Path to YAML config file")
    parser.add_argument("--env", choices=["dev", "staging", "production"], required=True)
    parser.add_argument("--dry-run", action="store_true", help="Preview without executing")
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    logger = setup_logging(verbose=args.verbose)
    logger.info(f"Starting health monitor for {args.env}")

    config = load_config(args.config)
    run_health_check(config, dry_run=args.dry_run, logger=logger)

if __name__ == "__main__":
    main()
```

## 4. Production-Grade Checklist

| Feature | Why It Matters |
|---|---|
| **CLI arguments** (`argparse`) | Professional interface, self-documenting |
| **Structured logging** | Audit trail, debugging, monitoring integration |
| **Configuration file** (YAML) | No hardcoded values, environment-specific settings |
| **Error handling** (try/except) | Graceful failure, meaningful error messages |
| **Exit codes** | CI/CD pipeline integration (0 = success, 1 = failure) |
| **Dry-run mode** | Preview changes before making them |
| **Timeouts** | Prevent hanging on network calls |
| **Concurrency** | Performance at scale |
| **Input validation** | Prevent crashes from bad configuration |
| **Secrets from env vars** | Never hardcode credentials |

## 5. Senior Engineer's Perspective
**Junior Engineer:** "Here's my script. It works."
**Senior Engineer:** "Does it log what it does? Does it have a dry-run mode? What happens if the network goes down halfway through? Can I run it from a CI/CD pipeline? Does it exit with the right code? Can someone who has never seen it understand what it does by reading `--help`? Production-grade means all of these, not just 'it works.'"

## 6. Quick Revision Notes
- Every production script needs: logging, argparse, error handling, exit codes, dry-run
- Structure: imports → logging setup → config → core logic → CLI entry point
- Always use `if __name__ == "__main__": main()` pattern
- Exit code 0 = success, 1 = failure (critical for CI/CD)
- Configuration via YAML files, secrets via environment variables
- Add `--dry-run` and `--verbose` to every tool that modifies infrastructure


---

