import requests
import json

# Setup from user screenshot
LLM_URL = "http://172.17.72.151:1234/v1/models"

def check_llm():
    print(f"Testing connectivity to {LLM_URL}...")
    try:
        # User screenshot shows: "http://172.17.72.151:1234"
        # The backend appends /v1/models or similar.
        # Let's try to list models.
        resp = requests.get(LLM_URL, timeout=5)
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.text[:200]}...")
        if resp.status_code == 200:
            print("SUCCESS: LLM is reachable!")
        else:
            print("WARNING: LLM reachable but returned error.")
    except Exception as e:
        print(f"ERROR: Cannot connect to LLM: {e}")

if __name__ == "__main__":
    check_llm()
