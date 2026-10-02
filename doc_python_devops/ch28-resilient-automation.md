<!-- TODO: Rewrite and humanize content from 16-advanced-automation\module-49-parallel-concurrent.md, 16-advanced-automation\module-50-retry-resilience.md -->

# Module 49 — Parallel & Concurrent Automation

## 1. Chapter Introduction
So far, every script we have written processes tasks one at a time—sequentially. If you need to check the health of 500 servers, a sequential script takes 500 × 3 seconds = 25 minutes. With parallel execution, you can check all 500 in under a minute. In this module, we will learn how to run tasks concurrently using Python's `threading`, `multiprocessing`, and `concurrent.futures` modules.

## 2. What You Will Learn
- The difference between threading, multiprocessing, and async IO.
- How to use `concurrent.futures.ThreadPoolExecutor` for I/O-bound tasks.
- How to use `concurrent.futures.ProcessPoolExecutor` for CPU-bound tasks.
- How to handle errors in concurrent operations.
- When to use which concurrency model.

## 3. Why This Topic Matters in DevOps
DevOps automation is dominated by I/O-bound tasks—API calls, SSH connections, health checks, file transfers. A sequential script that calls 200 cloud APIs one at a time is unbearably slow. Concurrent execution transforms a 30-minute job into a 30-second job.

## 4. Concept Explained in Simple Language
### Threading vs Multiprocessing

| Feature | Threading | Multiprocessing |
|---|---|---|
| Best for | I/O-bound tasks (API calls, SSH, file reads) | CPU-bound tasks (data processing, hashing) |
| How it works | Multiple threads share one process | Multiple separate processes |
| GIL limitation | Yes — only one thread runs Python at a time | No — each process has its own GIL |
| Memory | Shared (lightweight) | Separate (heavier) |
| Use case | 500 health checks, 100 API calls | Image processing, log analysis |

## 5. Real-World Analogy
**Sequential:** One chef in a restaurant cooking each dish one after another. 10 dishes = 10 × 10 minutes = 100 minutes.
**Threading:** One chef who starts boiling pasta, then immediately starts chopping vegetables while the pasta cooks (I/O waiting). 10 dishes ≈ 20 minutes.
**Multiprocessing:** Ten chefs, each cooking one dish simultaneously. 10 dishes ≈ 10 minutes.

## 6. Basic Example: Sequential vs Concurrent
```python
import time

# Sequential — SLOW
def check_server_sequential(servers):
    for server in servers:
        time.sleep(1)  # Simulates network call
        print(f"✅ {server} is healthy")

# Concurrent — FAST
from concurrent.futures import ThreadPoolExecutor

def check_single_server(server):
    time.sleep(1)  # Simulates network call
    return f"✅ {server} is healthy"

def check_servers_concurrent(servers):
    with ThreadPoolExecutor(max_workers=20) as executor:
        results = executor.map(check_single_server, servers)
        for result in results:
            print(result)

servers = [f"web-{i:03d}" for i in range(50)]

# Sequential: ~50 seconds
# Concurrent: ~3 seconds (with 20 threads)
```

## 7. DevOps Example: Parallel Health Checks
```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

def check_health(server):
    """Check health of a single server."""
    try:
        response = requests.get(f"http://{server}:8080/health", timeout=5)
        return {"server": server, "status": "healthy" if response.status_code == 200 else "unhealthy"}
    except requests.RequestException as e:
        return {"server": server, "status": "unreachable", "error": str(e)}

def check_fleet_health(servers, max_workers=20):
    """Check health of entire server fleet concurrently."""
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(check_health, server): server for server in servers}

        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            if result["status"] != "healthy":
                print(f"⚠️ {result['server']}: {result['status']}")

    healthy = sum(1 for r in results if r["status"] == "healthy")
    print(f"\n📊 Fleet Health: {healthy}/{len(results)} servers healthy")
    return results
```

## 8. Production Example: Rate-Limited Concurrent API Calls
```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time

class RateLimiter:
    """Simple rate limiter for API calls."""
    def __init__(self, max_per_second):
        self.interval = 1.0 / max_per_second
        self.lock = threading.Lock()
        self.last_call = 0

    def wait(self):
        with self.lock:
            now = time.time()
            elapsed = now - self.last_call
            if elapsed < self.interval:
                time.sleep(self.interval - elapsed)
            self.last_call = time.time()

rate_limiter = RateLimiter(max_per_second=10)

def rate_limited_api_call(resource_id):
    """Make an API call with rate limiting."""
    rate_limiter.wait()
    # API call here
    return f"Processed {resource_id}"

def process_resources(resource_ids, max_workers=5):
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(rate_limited_api_call, rid) for rid in resource_ids]
        for future in as_completed(futures):
            print(future.result())
```

## 9. Common Mistakes
- **Too many threads:** Creating 1,000 threads for 1,000 API calls will overwhelm the target server and your machine. Use a reasonable `max_workers` (typically 10–50).
- **Not handling exceptions in threads:** An exception in a thread is silently swallowed unless you call `future.result()`.
- **Race conditions:** When multiple threads modify shared data, use `threading.Lock()` to prevent corruption.
- **Using multiprocessing for I/O tasks:** Multiprocessing has higher overhead (process creation). Use threads for I/O, processes for CPU.

## 10. Senior Engineer's Perspective
**Junior Engineer:** "I'm making my health checker concurrent. I set `max_workers=500` for 500 servers."
**Senior Engineer:** "Stop. You'll open 500 simultaneous connections, overwhelm the network, and get rate-limited or blocked. Start with 20 workers and increase gradually while monitoring. Also, add error handling—if one thread crashes, `as_completed` ensures the others still report. And add a timeout to prevent threads from hanging forever."

## 11. Interview Questions
**Beginner:**
Q: What is the difference between threading and multiprocessing in Python?
A: Threading runs multiple threads in a single process, sharing memory. It is best for I/O-bound tasks (API calls, file reads). Multiprocessing runs multiple processes with separate memory. It is best for CPU-bound tasks because it bypasses the GIL.

**Intermediate:**
Q: Why is `ThreadPoolExecutor` preferred over manual `threading.Thread` for DevOps scripts?
A: `ThreadPoolExecutor` manages thread lifecycle, limits concurrency via `max_workers`, and provides `as_completed()` for processing results as they finish. Manual threading requires handling all of this yourself.

**Advanced:**
Q: You need to process 10,000 cloud resources concurrently, but the API has a rate limit of 100 requests per second. How do you design this?
A: Use a `ThreadPoolExecutor` with `max_workers` set lower than the rate limit (e.g., 20). Implement a `RateLimiter` class using `threading.Lock` that enforces a minimum interval between requests. Use `as_completed()` to process results as they arrive. Add exponential backoff retry for rate-limit errors (HTTP 429).

## 12. Chapter Summary
Concurrent execution transforms slow, sequential DevOps scripts into fast, scalable automation. Use `ThreadPoolExecutor` for I/O-bound tasks (API calls, health checks, SSH commands) and `ProcessPoolExecutor` for CPU-bound tasks (log parsing, hashing). Always limit concurrency with `max_workers`, handle errors per-thread, and implement rate limiting when calling external APIs.

## 13. Quick Revision Notes
- `ThreadPoolExecutor` — Best for I/O-bound (API calls, network)
- `ProcessPoolExecutor` — Best for CPU-bound (parsing, hashing)
- `executor.map(func, items)` — Simple parallel map
- `executor.submit(func, arg)` + `as_completed(futures)` — Flexible with error handling
- Always set reasonable `max_workers` (10–50 typical)
- Use `future.result()` to retrieve results and catch exceptions
- Add `timeout` to prevent hanging threads


---

# Module 50 — Retry, Timeout & Resilience Patterns

## 1. Chapter Introduction
Networks fail. APIs return 500 errors. Cloud providers have transient outages. DNS resolves slowly. In production, your automation scripts must survive all of this gracefully. In this module, we will learn the resilience patterns that separate fragile scripts from production-grade automation: retries with exponential backoff, timeouts, circuit breakers, and graceful degradation.

## 2. What You Will Learn
- How to implement retry logic with exponential backoff.
- How to use the `tenacity` library for advanced retries.
- How to set timeouts on all external operations.
- The circuit breaker pattern for failing fast.
- How to build graceful degradation into automation.

## 3. Why This Topic Matters in DevOps
An automation script that crashes on the first network error is worse than no automation at all—it gives a false sense of reliability. Production-grade automation expects failure and handles it: retry transient errors, timeout on hung connections, and alert on persistent failures.

## 4. Basic Example: Manual Retry with Exponential Backoff
```python
import time
import requests

def call_api_with_retry(url, max_retries=3, initial_delay=1):
    """Call an API with exponential backoff retry."""
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            delay = initial_delay * (2 ** (attempt - 1))  # 1s, 2s, 4s
            if attempt == max_retries:
                print(f"❌ All {max_retries} attempts failed: {e}")
                raise
            print(f"⚠️ Attempt {attempt} failed: {e}. Retrying in {delay}s...")
            time.sleep(delay)
```

## 5. DevOps Example: Using Tenacity Library
```python
# pip install tenacity
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import requests

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=30),
    retry=retry_if_exception_type((requests.ConnectionError, requests.Timeout)),
    before_sleep=lambda retry_state: print(f"⚠️ Retry {retry_state.attempt_number}...")
)
def check_service_health(url):
    """Check service health with automatic retries."""
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    return response.json()
```

## 6. Production Example: Timeout Wrapper
```python
import signal
import functools

class TimeoutError(Exception):
    pass

def timeout(seconds):
    """Decorator that raises TimeoutError if function takes too long."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            def handler(signum, frame):
                raise TimeoutError(f"{func.__name__} timed out after {seconds}s")
            old_handler = signal.signal(signal.SIGALRM, handler)
            signal.alarm(seconds)
            try:
                return func(*args, **kwargs)
            finally:
                signal.alarm(0)
                signal.signal(signal.SIGALRM, old_handler)
        return wrapper
    return decorator

@timeout(30)
def deploy_application(version):
    """Deploy with a 30-second timeout."""
    # deployment logic here
    pass
```

## 7. Production Example: Circuit Breaker Pattern
```python
import time

class CircuitBreaker:
    """Prevents repeated calls to a failing service."""
    def __init__(self, failure_threshold=5, reset_timeout=60):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = "CLOSED"  # CLOSED (normal), OPEN (blocking), HALF-OPEN (testing)

    def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.reset_timeout:
                self.state = "HALF-OPEN"
                print("🟡 Circuit half-open: testing...")
            else:
                raise Exception("🔴 Circuit OPEN — service unavailable, failing fast")

        try:
            result = func(*args, **kwargs)
            if self.state == "HALF-OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
                print("🟢 Circuit CLOSED — service recovered")
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                print(f"🔴 Circuit OPEN after {self.failure_count} failures")
            raise
```

## 8. Common Mistakes
- **Retrying non-transient errors:** Retrying a 401 (Unauthorized) or 404 (Not Found) is pointless. Only retry on 429 (Rate Limit), 500 (Server Error), 502, 503, 504, and connection errors.
- **No timeout on requests:** A `requests.get()` without `timeout` can hang forever, blocking your entire pipeline.
- **Fixed retry delay:** Using `time.sleep(5)` for every retry creates a "thundering herd." Use exponential backoff with jitter.

## 9. Senior Engineer's Perspective
**Junior Engineer:** "My script retries 10 times with a 1-second delay each."
**Senior Engineer:** "Three problems: (1) No exponential backoff means you're hammering the failing service, making it worse. (2) No maximum timeout means your script could retry for hours. (3) No differentiation between transient and permanent errors. Use exponential backoff (1s, 2s, 4s, 8s), cap at 30s, and only retry on transient HTTP errors (5xx, connection errors)."

## 10. Interview Questions
**Beginner:**
Q: What is exponential backoff and why is it important?
A: Exponential backoff increases the wait time between retries exponentially (1s, 2s, 4s, 8s, 16s). It prevents overwhelming a struggling service with repeated requests, giving it time to recover.

**Advanced:**
Q: Explain the circuit breaker pattern. When would you use it in DevOps automation?
A: A circuit breaker tracks consecutive failures to a service. After a threshold (e.g., 5 failures), it "opens" and immediately fails subsequent requests without calling the service, preventing resource waste. After a timeout, it enters "half-open" state and allows one test request. If it succeeds, the circuit closes. Use it when calling flaky external services (monitoring APIs, third-party webhooks) to fail fast instead of waiting for timeouts.

## 11. Chapter Summary
Production-grade automation expects failure. Implement retry with exponential backoff for transient errors, set timeouts on all external operations, and use circuit breakers for services that may be down for extended periods. The `tenacity` library simplifies retry logic. Never retry permanent errors, never make requests without timeouts, and always use exponential backoff instead of fixed delays.

## 12. Quick Revision Notes
- Always set `timeout` on `requests.get()` / `requests.post()`
- Retry only transient errors: 429, 500, 502, 503, 504, ConnectionError
- Exponential backoff: `delay = base * (2 ** attempt)`
- `tenacity` library: `@retry(stop=stop_after_attempt(5), wait=wait_exponential())`
- Circuit breaker: CLOSED → OPEN (after N failures) → HALF-OPEN (test) → CLOSED
- Add jitter to backoff: `delay + random.uniform(0, 1)` to avoid thundering herd


---

