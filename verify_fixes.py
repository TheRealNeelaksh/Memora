import requests
import json
import time

BASE_URL = "http://localhost:5500"
TEST_IMAGES_PATH = r"g:\Projects\Memora\testing_images"

def test_api():
    print(f"Testing API at {BASE_URL}...")
    
    # 1. Mount
    print(f"\n1. Mounting {TEST_IMAGES_PATH}...")
    try:
        res = requests.post(f"{BASE_URL}/mount", json={"path": TEST_IMAGES_PATH})
        if res.status_code == 200:
            print(f"   Success: {res.json()}")
        else:
            print(f"   Failed: {res.status_code} - {res.text}")
            return
    except Exception as e:
        print(f"   Error connecting to backend: {e}")
        return

    # 2. Scan (Quick check, might take time if many images, but testing_images should be small?)
    #    User said "added some testing photos", assuming small batch.
    print(f"\n2. Scanning...")
    try:
        res = requests.post(f"{BASE_URL}/scan", json={"rescan": False})
        print(f"   Scan Result: {res.json()}")
    except Exception as e:
        print(f"   Scan Error: {e}")

    # 3. Test /memories (Grid View Fix)
    print(f"\n3. Testing GET /memories (Grid View Fix)...")
    try:
        res = requests.get(f"{BASE_URL}/memories?limit=10")
        if res.status_code == 200:
            data = res.json()["results"]
            print(f"   Success. Returned {len(data)} memories.")
            if len(data) == 0:
                print("   WARNING: Returned 0 memories. Grid will still be empty!")
            else:
                 print("   PASS: Memories returned.")
        else:
             print(f"   FAIL: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"   Error: {e}")

    # 4. Test Search (Threshold Fix)
    print(f"\n4. Testing POST /search (Threshold Fix)...")
    query = "test" 
    try:
        res = requests.post(f"{BASE_URL}/search", json={"query": query, "top_k": 5})
        if res.status_code == 200:
            data = res.json()["results"]
            print(f"   Success. Returned {len(data)} results for query '{query}'.")
            if len(data) > 1:
                print("   PASS: Multiple results returned (Threshold relaxed).")
            else:
                print(f"   WARNING: Returned {len(data)} result(s). Threshold might still be too strict or only 1 image exists.")
                # If only 1 image in folder, this is expected.
        else:
             print(f"   FAIL: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_api()
