# RecallBox - Phase 1.5

RecallBox is a local-first memory indexing system designed to make your visual history searchable by *scene* and *content*, not just date.

## Phase 1.5: Scene-Based Visual Memory

Phase 1.5 introduces "Scene Understanding". Instead of just reading text (OCR), the system uses a local Vision LLM (like Ollama or LM Studio) to look at your images and describe them.

This allows you to search for things like:
- "friends playing cards"
- "sunny day at the beach"
- "receipt for coffee"

### Prerequisites

1.  **Python 3.10+**
2.  **Node.js 18+**
3.  **Local Vision LLM** (Ollama or LM Studio)

### Setup Guide

#### 1. Start the Vision LLM

You need a local LLM running that supports vision (image input).

**Option A: Ollama (Recommended)**

1.  Install [Ollama](https://ollama.com/).
2.  Pull a vision model. We recommend `llava` or `moondream` for speed.
    ```bash
    ollama pull llava
    ```
3.  Start the server (usually runs automatically on port 11434).

**Option B: LM Studio**

1.  Install [LM Studio](https://lmstudio.ai/).
2.  Load a vision-capable model (e.g., `BakLLaVA`, `Obsidian`, `LLaVA`).
3.  Start the Local Server on port `1234`.

#### 2. Start the Backend

1.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
    *(Note: Ensure `httpx`, `pillow`, `sentence-transformers`, `faiss-cpu`, `fastapi`, `uvicorn` are installed)*

2.  Run the server:
    ```bash
    uvicorn app.main:app --port 5500 --reload
    ```

#### 3. Start the Frontend

1.  Navigate to `frontend/`:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
2.  Open `http://localhost:5173`.

### Configuration & Usage

1.  **Mount a Drive:**
    - In the UI, enter the absolute path to a folder of images you want to index.
    - Click "Mount".

2.  **Configure Vision:**
    - Click the **Settings (Gear)** icon in the header.
    - **Endpoint:**
        - For Ollama: `http://localhost:11434`
        - For LM Studio: `http://localhost:1234`
    - **Model Name:**
        - For Ollama: `llava`
        - For LM Studio: Matches the loaded model ID.
    - Click **"Test Connection"** to verify.
    - Click **"Save Configuration"**.

3.  **Scan & Index:**
    - Click "Scan Drive".
    - The system will iterate through your images.
    - It sends each image to the local LLM to generate a summary and tags.
    - *Note: This is slower than Phase 1 because it relies on the LLM speed.*

4.  **Search:**
    - Type "two people sitting on a bench".
    - The backend (optionally) expands this query using the LLM to better match scene descriptions.
    - Results appear with summaries and tags.

5.  **Inspect:**
    - Click any image.
    - Switch to the **"Vision Inspection"** tab.
    - You will see the raw JSON output from the LLM ("Why did it think this?").

### Troubleshooting

-   **Vision Failed?** Check the "Vision Inspection" tab on the image. It will show the error status.
-   **No Results?** Ensure you clicked "Scan" *after* configuring vision. If you scanned before configuring, click "Rescan" to re-process images.
-   **Slow?** Vision inference is computationally expensive. Ensure you have GPU acceleration enabled in Ollama/LM Studio if available.

### Architecture Notes

-   **Backend:** FastAPI + SQLite + FAISS (Vector Search).
-   **Vision Adapter:** Located in `app/vision/adapter.py`. Handles the JSON schema enforcement.
-   **Frontend:** React + Vite.

