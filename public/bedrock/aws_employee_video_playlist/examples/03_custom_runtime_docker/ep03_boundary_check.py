import signal
import sys
import time

# =====================================================================
# EPISODE 03: Runtime Deep Dive
# File: ep03_boundary_check.py (VM Boundaries & Cleanup)
# =====================================================================

# Handle Windows/Unix cross-platform compatibility for resource tracking
try:
    import resource
    WINDOWS_OS = False
except ImportError:
    WINDOWS_OS = True

def graceful_shutdown_handler(signum, frame):
    print(f"\n[SIGNAL DETECTED] Received shutdown signal ({signum}). Initiating exit procedure...")
    print("[FLUSH STATE] Committing active session variables to database...")
    time.sleep(0.5)
    print("[CLEANUP] Terminating active TCP connections and releasing memory...")
    sys.exit(0)

# Register signals (SIGINT/SIGTERM are UNIX signals; SIGTERM is mocked on Windows if needed)
try:
    signal.signal(signal.SIGINT, graceful_shutdown_handler)
    signal.signal(signal.SIGTERM, graceful_shutdown_handler)
except AttributeError:
    # Some signals might not exist in Windows Command shell environments
    pass

class MicroVMResourceManager:
    @staticmethod
    def get_memory_usage_mb() -> float:
        if WINDOWS_OS:
            # Mock value since 'resource' is Unix-only
            return 25.0
        usage_bytes = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        return usage_bytes / 1024.0

    @staticmethod
    def check_limits(max_mb_allowed: float = 512.0) -> bool:
        current_mem = MicroVMResourceManager.get_memory_usage_mb()
        print(f"[RESOURCES] Current Container RAM Usage: {current_mem:.2f} MB / Allowed Limit: {max_mb_allowed} MB")
        if current_mem > max_mb_allowed:
            print("[ALERT] Memory threshold reached! Reducing prompt size or recycling worker threads.")
            return False
        return True

if __name__ == "__main__":
    print("--- Simulating Firecracker microVM Run and Resource Supervision ---")
    MicroVMResourceManager.check_limits()

# =====================================================================
# 📚 INTERVIEW & ARCHITECTURE NOTES (INTERVIEW-PREP SECTION)
# =====================================================================
# Q1: What are the strict limitations of the AWS Bedrock AgentCore MicroVM runtime?
# A1: The runtime boundaries are:
#     - Max execution time: 15 minutes (900 seconds) for a single synchronous request loop.
#     - Maximum payload size: 100MB (files or data inputs passed to tools).
#     - Session lifespan TTL: 8 hours (28800 seconds). After 8 hours, the session's 
#       isolated microVM container instance is retired.
#
# Q2: Why is trapping signals like SIGTERM essential in serverless agents?
# A2: Because microVMs spin up and down dynamically. When a session reaches its 
#     TTL or scales down, AWS triggers a SIGTERM. If the agent does not capture this signal, 
#     active chat logs, unfinished scraper operations, or unsaved user settings 
#     are lost forever. Catching the signal allows the program to flush states to DynamoDB.
#
# Q3: How is resource checking used to prevent Out Of Memory (OOM) crashes?
# A3: Python's 'resource' library allows tracing maximum resident set size (maxrss). 
#     If the agent notices it is approaching the VM's RAM allocation limits (e.g. 512MB), 
#     it can prune prompt history or garbage collect heavy variables before the OS 
#     forces an unrecoverable SIGKILL OOM panic.
# =====================================================================
