import subprocess
import sys
import signal
import time
import os

def run():
    # Start Backend
    print("Starting Backend (Uvicorn)...")
    backend_env = os.environ.copy()
    backend_process = subprocess.Popen(
        ["uvicorn", "app.main:app", "--port", "5500", "--host", "127.0.0.1"],
        env=backend_env
    )

    # Start Frontend
    print("Starting Frontend (Vite)...")
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd="frontend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    print("\nRecallBox is running!")
    print("Backend: http://127.0.0.1:5500")
    print("Frontend: http://localhost:5173 (check vite output if different)")
    print("\nPress Ctrl+C to stop.")

    try:
        while True:
            time.sleep(1)
            if backend_process.poll() is not None:
                print("Backend exited unexpectedly.")
                break
            if frontend_process.poll() is not None:
                print("Frontend exited unexpectedly.")
                break
    except KeyboardInterrupt:
        print("\nStopping services...")
    finally:
        backend_process.terminate()
        frontend_process.terminate()
        print("Services stopped.")

if __name__ == "__main__":
    run()
