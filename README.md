# Memora 🧠📸

> **Your locally-hosted, AI-powered photographic memory.**  
> *Rediscover your photos with natural language search, powered by local AI.*

---

## 🧐 What is Memora?

**Memora** (internally codenamed *RecallBox*) is a privacy-focused, local-first application designed to index, analyze, and search your vast photo libraries using state-of-the-art AI. 

Unlike cloud services that farm your data, Memora runs entirely on your machine. It uses:
- **Computer Vision** (via Local LLMs like LLaVA/BakLLaVA) to describe images.
- **OCR** (Tesseract) to read text inside photos.
- **Vector Embeddings** (SentenceTransformers + FAISS) for semantic search.
- **Hybrid Search** logic to find exactly what you're looking for, whether it's a "red car" or "screenshot of the wifi password".

## 💡 Why Memora?

We built Memora to solve the "Digital Amnesia" problem:
1.  **Privacy**: Your photos never leave your hard drive.
2.  **No Subscriptions**: No monthly fees for "cloud storage" just to search your own memories.
3.  **Local Power**: Leverage your own GPU for AI processing.
4.  **Smart Retrieval**: Stop scrolling for hours. Just ask, "Where did I park my car?" or "Show me the menu from that Thai restaurant."

## ✨ Key Features

-   **🔍 Hybrid Search**: Combines **Keyword Boosting** (exact matches) with **Vector Semantic Search** (understanding concepts). Searching for "man in suit" actually looks for the *concept* of a formal outfit, not just the text.
-   **👁️ Local Vision Intelligence**: Connects to local LLM endpoints (like LM Studio) to generate detailed descriptions of your photos automatically.
-   **📄 OCR Integration**: Automatically extracts and indexes text from documents, receipts, and screenshots.
-   **⚡ High-Performance Grid**: A React-based frontend capable of rendering thousands of memories smoothly.
-   **🖼️ "Open Original"**: Seamlessly jump from the app to the actual file in your OS's file explorer or photo viewer.
-   **🔎 Visual Inspection**: View the raw JSON data the AI "sees" for every image.

---

## 🚀 Getting Started

### Prerequisites

*   **OS**: Windows, macOS, or Linux (Windows tested primarily).
*   **Python**: Version 3.10 or higher.
*   **Node.js**: Version 18 or higher (for the frontend).
*   **Tesseract OCR**: Must be installed and reachable in your system PATH.
    *   *Windows*: [Download Installer](https://github.com/UB-Mannheim/tesseract/wiki)
*   **Local LLM (Optional but Recommended)**:
    *   We recommend **[LM Studio](https://lmstudio.ai/)** running a vision-capable model (e.g., `BakLLaVA`, `LLaVA`, or `nomic-embed-text`).
    *   Enable the Local Inference Server on port `1234`.

### 📥 Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/TheRealNeelaksh/Memora.git
    cd Memora
    ```

2.  **Backend Setup**
    ```bash
    # Create a virtual environment
    python -m venv venv
    
    # Activate it (Windows)
    .\venv\Scripts\activate
    
    # Install dependencies
    pip install -r requirements.txt
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    # Return to root
    cd ..
    ```

---

## ⚡ Quick Start

We provide a **unified runner script** to start both the backend (FastAPI) and frontend (Vite) simultaneously with graceful shutdown handling.

**Just run:**
```bash
python run_app.py
```

*   **Frontend**: Open [http://localhost:5173](http://localhost:5173) in your browser.
*   **Backend API**: Running at [http://127.0.0.1:5500](http://127.0.0.1:5500) (Docs at `/docs`).

---

## 📖 Usage Guide

### 1. Mount Your Drive
On the main screen, enter the **absolute path** to your photo folder (e.g., `D:\Photos\2023`) and click **Mount**.
*   *Note: This creates a lightweight SQLite index (`.memory_index.db`) in that folder.*

### 2. Scan & Index
Click the **Scan** button.
*   **Stage 1 (Fast)**: Files are discovered, hashes generated, and thumbnails created.
*   **Stage 2 (Vision)**: If your LLM is connected, Memora will send images to the AI for analysis. *This takes time depending on your GPU.*

### 3. Search
Type anything in the search bar.
*   *"Dog running in the park"*
*   *"Invoice from January"*
*   *"Birthday cake"*
Memora uses query expansion to find relevant synonyms and concepts.

### 4. Search Results & Filters
*   **Accuracy Scores**: See how confident the AI is about a match (0.0 - 1.0).
*   **Open Original**: Click any memory to see details. Use the "Open Original" button to launch the file in your default photo viewer.

---

## 🏗️ Architecture

Memora is a **full-stack application**:

### Backend (`/app`)
*   **Framework**: FastAPI (Python).
*   **Database**: SQLite (metadata) + FAISS (Vector Index).
*   **AI Engine**: `SentenceTransformers` matches text-to-image embeddings. `VisionAdapter` talks to local LLMs.

### Frontend (`/frontend`)
*   **Framework**: React (Vite).
*   **Styling**: TailwindCSS.
*   **State Management**: React Hooks + Local Component State.
*   **Icons**: Lucide React.

---

## ❓ FAQ & Troubleshooting

**Q: My "Vision Inspection" is empty/unknown?**  
A: Ensure your Local LLM Server is running and reachable. If you recently updated the app, try clicking **Rescan** to regenerate descriptions with our improved JSON parser.

**Q: The endpoint `http://localhost:5500` is in use?**  
A: The `run_app.py` script tries to kill old processes, but if it fails, manually find and kill any `python.exe` or `uvicorn` processes in your Task Manager.

**Q: Search results are weird?**  
A: Check if your LLM is "hallucinating" (making things up). We implemented a "Strict Mode" for query expansion, but smaller models can still be chatty. Try a different model in LM Studio.

**Q: How do I backup my index?**  
A: Just backup the `.memory_index.db` file located inside your mounted photo directory. All your thumbnails and metadata are there.

---

Made with ❤️ by Neelaksh & The Deepmind Team.
