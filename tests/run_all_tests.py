"""
AutoTailor AI -- Master Test Suite Runner
Executes:
1. tests/test_applied_feature.py (Applied status tracking, sync & persistence)
2. tests/test_application_copilot.py (Copilot Q&A Playwright extraction)
3. tests/test_automation.py (25-point end-to-end integration suite)
4. tests/test_visual_verification.py (Visual rendering, Playwright in-page autofill)
"""

import sys
import subprocess
import time
import urllib.request
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def is_server_healthy():
    try:
        with urllib.request.urlopen("http://127.0.0.1:8500/api/health", timeout=2) as resp:
            return resp.status == 200
    except Exception:
        return False

def ensure_server():
    if is_server_healthy():
        print("[+] Backend server is already running on http://127.0.0.1:8500")
        return None
    print("[*] Backend server not detected. Starting uvicorn backend.app:app on port 8500...")
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app:app", "--host", "127.0.0.1", "--port", "8500"],
        cwd=root_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    # Wait for server to become healthy
    for _ in range(30):
        time.sleep(0.5)
        if is_server_healthy():
            print("[+] Backend server successfully started and healthy!")
            return proc
    print("[!] Warning: Server did not report healthy in time, proceeding anyway...")
    return proc

def run_suite(name, script_path):
    print(f"\n{'='*70}")
    print(f"RUNNING SUITE: {name} ({script_path})")
    print(f"{'='*70}")
    start = time.time()
    res = subprocess.run([sys.executable, script_path], capture_output=True, text=True, encoding="utf-8", errors="replace")
    duration = time.time() - start
    print(res.stdout)
    if res.stderr:
        print("STDERR:")
        print(res.stderr)
    status = "PASSED" if res.returncode == 0 else "FAILED"
    print(f"\n>>> [{status}] {name} completed in {duration:.2f}s (Exit code: {res.returncode})\n")
    return res.returncode == 0, duration

def main():
    print("======================================================================")
    print("AUTOTAILOR AI -- FULL REGRESSION & COMPREHENSIVE TEST RUNNER")
    print("======================================================================")
    
    server_proc = ensure_server()

    suites = [
        ("Applied Internship Tracking & Persistence", "tests/test_applied_feature.py"),
        ("Application Copilot & Multi-Question Extractor", "tests/test_application_copilot.py"),
        ("25-Point End-to-End Automation & AI Suite", "tests/test_automation.py"),
        ("Visual DOM & Greenhouse In-Page Autofill", "tests/test_visual_verification.py")
    ]
    
    results = []
    total_start = time.time()
    
    try:
        for name, script in suites:
            passed, dur = run_suite(name, script)
            results.append((name, passed, dur))
    finally:
        if server_proc:
            print("[*] Shutting down spawned test server...")
            server_proc.terminate()
            try:
                server_proc.wait(timeout=5)
            except Exception:
                server_proc.kill()
        
    total_duration = time.time() - total_start
    
    print("\n" + "="*70)
    print("MASTER TEST SUMMARY")
    print("="*70)
    all_passed = True
    for name, passed, dur in results:
        status_str = "[PASS]" if passed else "[FAIL]"
        if not passed:
            all_passed = False
        print(f"  {status_str} {name:.<50} {dur:>6.2f}s")
        
    print("-" * 70)
    print(f"Total Test Time: {total_duration:.2f}s")
    if all_passed:
        print("RESULT: ALL TEST SUITES PASSED (100% GREEN)")
        sys.exit(0)
    else:
        print("RESULT: ONE OR MORE SUITES FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()
