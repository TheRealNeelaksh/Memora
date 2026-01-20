import subprocess
import sys
import signal
import time
import os
from pathlib import Path

def run():
    BASE_DIR = Path(__file__).parent.resolve()
    VENV_PYTHON = BASE_DIR / "venv" / "Scripts" / "python.exe"
    
    # Check for venv
    if VENV_PYTHON.exists():
        print(f"Using venv python: {VENV_PYTHON}")
        python_cmd = str(VENV_PYTHON)
    else:
        print("Warning: 'venv' not found in project root. Using system 'python'.")
        python_cmd = "python"

    # Start Backend
    print("Starting Backend (Uvicorn)...")
    # We use python -m uvicorn to ensure we use the pkg from that python env
    backend_process = subprocess.Popen(
        [python_cmd, "-m", "uvicorn", "app.main:app", "--port", "5500", "--host", "127.0.0.1"],
        cwd=str(BASE_DIR),
        env=os.environ.copy()
    )

    # Start Frontend
    print("Starting Frontend (Vite)...")
    frontend_dir = BASE_DIR / "frontend"
    # shell=True is often needed on Windows for npm/npx wrappers to resolve
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(frontend_dir),
        shell=True
    )

    print("\n" + "="*40)
    print("RecallBox is running!")
    print("Backend:  http://127.0.0.1:5500")
    print("Frontend: http://localhost:5173")
    print("="*40 + "\n")
    print("Press Ctrl+C to stop all services.\n")

    try:
        while True:
            time.sleep(1)
            if backend_process.poll() is not None:
                print("Backend exited unexpectedly!")
                break
            if frontend_process.poll() is not None:
                print("Frontend exited unexpectedly!")
                break
    except KeyboardInterrupt:
        print("\nStopping services...")
    finally:
        # Terminate processes
        try:
            backend_process.terminate()
        except:
            pass
            
        try:
            # On Windows shell=True spawns a fresh cmd.exe, terminating it might not kill children.
            # But usually for dev tools it's 'okay' enough or user closes window.
            # For better cleanup we'd need psutil but let's stick to stdlib.
            if os.name == 'nt':
                # Force kill tree
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(frontend_process.pid)])
            else:
                frontend_process.terminate()
        except:
            pass
            
        print("Services stopped.")

if __name__ == "__main__":
    run()
