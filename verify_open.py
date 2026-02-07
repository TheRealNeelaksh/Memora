import requests
import json
import time

API_BASE = "http://127.0.0.1:5500"

def test_open():
    print("1. Mounting project...")
    try:
        mres = requests.post(f"{API_BASE}/mount", json={"path": r"g:\Projects\Memora"})
        print(f"Mount response: {mres.json()}")
        
        print("1b. Scanning...")
        sres = requests.post(f"{API_BASE}/scan", json={})
        print(f"Scan response: {sres.json()}")
        
    except Exception as e:
        print(f"Mount/Scan warning: {e}")

    print("2. Searching for a file to open...")
    # Search for anything to get a valid file_id
    try:
        res = requests.post(f"{API_BASE}/search", json={"query": "test", "top_k": 5})
        if res.status_code != 200:
            print(f"Search failed: {res.status_code} {res.text}")
            return
        
        data = res.json()
        results = data.get("results", [])
        
        if not results:
            print("No results found. Cannot test open.")
            return

        file_id = results[0]["file_id"]
        path = results[0]["path"]
        print(f"Found file: {path} (ID: {file_id})")
        
        print(f"2. Attempting to open file_id: {file_id}")
        open_res = requests.post(f"{API_BASE}/open", json={"file_id": file_id})
        
        if open_res.status_code == 200:
            print("SUCCESS: /open endpoint returned 200 OK.")
            print(f"Response: {open_res.json()}")
        else:
            print(f"FAILURE: /open endpoint returned {open_res.status_code}")
            print(f"Response: {open_res.text}")

    except Exception as e:
        print(f"Exception during test: {e}")

if __name__ == "__main__":
    test_open()
