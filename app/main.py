# app/main.py
import os
import io
import hashlib
import sqlite3
import base64
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from fastapi.responses import Response, JSONResponse, FileResponse
from sentence_transformers import SentenceTransformer
from PIL import Image, ImageOps
import numpy as np
import faiss
import pytesseract
from datetime import datetime

from .db import init_db, row_to_dict
from .indexer import scan_and_index
from .faiss_mgr import FaissManager
from .vision.adapter import VisionAdapter

APP_DIR = Path(__file__).resolve().parent
app = FastAPI(title="Memory Brain - Phase1.5")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



MODEL_NAME = "all-MiniLM-L6-v2"
EMBED_DIM = 384

# Global runtime state (simple single-drive focus)
state = {
    "mounted_path": None,
    "db_path": None,
    "conn": None,
    "faiss": None,
    "embed_model": None
}

# Simple boot
@app.on_event("startup")
def load_model():
    try:
        state["embed_model"] = SentenceTransformer(MODEL_NAME)
    except Exception as e:
        raise RuntimeError(f"Failed loading embedding model: {e}")

class MountRequest(BaseModel):
    path: str

@app.post("/mount")
def mount(req: MountRequest):
    p = Path(req.path)
    if not p.exists() or not p.is_dir():
        raise HTTPException(status_code=400, detail="path does not exist or is not a directory")
    db_path = p.joinpath(".memory_index.db")
    conn = init_db(str(db_path))
    state.update({
        "mounted_path": str(p),
        "db_path": str(db_path),
        "conn": conn,
        "faiss": FaissManager(EMBED_DIM)
    })
    # Build FAISS from existing DB
    state["faiss"].build_from_db(conn)
    # count entries
    cur = conn.cursor()
    cur.execute("SELECT COUNT(1) FROM memories")
    count = cur.fetchone()[0]
    return {"status": "ok", "db_path": str(db_path), "count": count}

class ScanRequest(BaseModel):
    path: Optional[str] = None
    rescan: Optional[bool] = False

@app.post("/scan")
def scan(req: ScanRequest):
    if req.path:
        base = Path(req.path)
    else:
        if not state["mounted_path"]:
            raise HTTPException(status_code=400, detail="No mounted path. Call /mount first or supply path.")
        base = Path(state["mounted_path"])
    if not base.exists():
        raise HTTPException(status_code=400, detail="scan path does not exist")
    conn = state["conn"] or init_db(str(base.joinpath(".memory_index.db")))
    model = state["embed_model"]

    # Load vision config if available
    vision_adapter = None
    try:
        c = conn.cursor()
        c.execute("SELECT endpoint_url, model_name, api_key FROM vision_config WHERE id=1")
        row = c.fetchone()
        if row:
            vision_adapter = VisionAdapter(row[0], row[1], row[2])
    except Exception as e:
        print(f"Failed to load vision config: {e}")

    added, skipped = scan_and_index(base, conn, model, rebuild=req.rescan, faiss_mgr=state.get("faiss"), vision_adapter=vision_adapter)
    # After scan, ensure FAISS rebuilt if needed
    if state.get("faiss"):
        state["faiss"].build_from_db(conn)
    return {"status": "ok", "scanned_path": str(base), "new": added, "skipped": skipped}

class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 12
    date_from: Optional[str] = None
    date_to: Optional[str] = None

@app.post("/search")
async def search(req: SearchRequest):
    if not state.get("faiss") or state["faiss"].index.ntotal == 0:
        # try to build from DB
        if state.get("conn"):
            state["faiss"].build_from_db(state["conn"])
        else:
            raise HTTPException(status_code=400, detail="no index available; mount and scan first")

    # Query rewriting
    search_query = req.query
    conn = state.get("conn")
    if conn:
        try:
            c = conn.cursor()
            c.execute("SELECT endpoint_url, model_name, api_key FROM vision_config WHERE id=1")
            row = c.fetchone()
            if row:
                adapter = VisionAdapter(row[0], row[1], row[2])
                expanded = await adapter.expand_query(req.query)
                if expanded and len(expanded) > 5:
                    print(f"Rewrote query '{req.query}' -> '{expanded}'")
                    search_query = expanded
        except Exception as e:
            print(f"Query expansion failed: {e}")

    qvec = state["embed_model"].encode(search_query).astype("float32")
    results = state["faiss"].search(qvec, topk=req.top_k)
    
    # ------------------ Hybrid Scoring & Re-ranking ------------------
    # Boost factor: If raw query terms exist in text, improve score (lower distance).
    raw_terms = [t.lower() for t in req.query.split() if len(t) > 2] # Ignore small words
    
    processed_results = []
    
    c = conn.cursor()
    for r in results:
        fid, path, score = r["file_id"], r["path"], r["score"]
        
        c.execute("SELECT file_id, path, created_at, exif_date, memory_summary, thumbnail, tags, vision_status FROM memories WHERE file_id=?", (fid,))
        row = c.fetchone()
        if not row:
            continue
            
        file_id, path_val, created_at, exif_date, summary, thumbnail_blob, tags, vision_status = row

        # Date filtering
        if req.date_from or req.date_to:
            ok = True
            if req.date_from and exif_date and exif_date < req.date_from: ok = False
            if req.date_to and exif_date and exif_date > req.date_to: ok = False
            if not ok: continue
        
        # --- Keyword Boosting ---
        text_content = (summary or "").lower() + " " + (tags or "").lower()
        
        # Count exact keyword matches
        matches = sum(1 for term in raw_terms if term in text_content)
        if matches > 0:
            # Significant boost for exact matches
            # e.g. 1 match -> score * 0.6, 2 matches -> score * 0.4
            multiplier = max(0.2, 0.7 - (matches * 0.15)) 
            score = score * multiplier
        
        thumb_b64 = None
        if thumbnail_blob:
            thumb_b64 = "data:image/jpeg;base64," + base64.b64encode(thumbnail_blob).decode("utf-8")

        processed_results.append({
             "file_id": file_id,
             "path": path_val,
             "score": float(score),
             "summary": summary,
             "tags": tags,
             "vision_status": vision_status,
             "created_at": created_at,
             "exif_date": exif_date,
             "thumbnail_b64": thumb_b64
        })

    # Sort by new scores (Ascending)
    processed_results.sort(key=lambda x: x["score"])
    
    # --- Dynamic Filtering ---
    # Only show results within a reasonable range of the top result
    if processed_results:
        best_score = processed_results[0]["score"]
        # Allow results up to +0.5 distance from best (or 1.5x, whichever is safer)
        cutoff = best_score + 0.5 
        
        # Hard cap to prevent total garbage if everything is bad (e.g. > 1.4 unboosted)
        # But if boosted, score will be < 1.0.
        
        filtered = [res for res in processed_results if res["score"] <= cutoff]
        processed_results = filtered

    print(f"Search found {len(processed_results)} results (after filtering).")
    for r in processed_results[:3]:
        print(f" - {r['path']} (Score: {r['score']})")

    return {"results": processed_results}

class OpenRequest(BaseModel):
    file_id: str

@app.post("/open")
def open_file(req: OpenRequest):
    if not state.get("conn"):
        raise HTTPException(status_code=400, detail="No DB loaded")
    c = state["conn"].cursor()
    c.execute("SELECT path FROM memories WHERE file_id=?", (req.file_id,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="File not found")
    
    path = row[0]
    import sys
    import subprocess
    
    try:
        if os.name == 'nt':
            os.startfile(path)
        elif sys.platform == 'darwin':
            subprocess.call(['open', path])
        else:
            subprocess.call(['xdg-open', path])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open file: {str(e)}")
        
    return {"status": "opened"}

@app.get("/images/{file_id}")
def get_full_image(file_id: str):
    if not state.get("conn"):
        raise HTTPException(status_code=400, detail="No DB loaded")
    c = state["conn"].cursor()
    c.execute("SELECT path FROM memories WHERE file_id=?", (file_id,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="File not found")
    
    path = row[0]
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File on disk not found")
        
    return FileResponse(path)

@app.get("/thumbnail/{file_id}")
def thumbnail(file_id: str):
    if not state.get("conn"):
        raise HTTPException(status_code=400, detail="No DB loaded")
    c = state["conn"].cursor()
    c.execute("SELECT thumbnail FROM memories WHERE file_id=?", (file_id,))
    row = c.fetchone()
    if not row or not row[0]:
        raise HTTPException(status_code=404, detail="thumbnail not found")
    return Response(content=row[0], media_type="image/jpeg")

@app.get("/memory/{file_id}")
def memory(file_id: str):
    if not state.get("conn"):
        raise HTTPException(status_code=400, detail="No DB loaded")
    c = state["conn"].cursor()
    c.execute("SELECT file_id, path, hash, created_at, modified_at, exif_date, ocr_text, caption, memory_summary, tags, vision_json, vision_status FROM memories WHERE file_id=?", (file_id,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="memory not found")
    rec = {
        "file_id": row[0],
        "path": row[1],
        "hash": row[2],
        "created_at": row[3],
        "modified_at": row[4],
        "exif_date": row[5],
        "ocr_text": row[6],
        "caption": row[7],
        "memory_summary": row[8],
        "tags": row[9],
        "vision_json": row[10],
        "vision_status": row[11]
    }
    return rec

@app.get("/health")
def health():
    return {"status": "ok", "mounted_path": state.get("mounted_path")}

@app.get("/memories")
def get_memories(limit: int = 50, offset: int = 0):
    if not state.get("conn"):
        raise HTTPException(status_code=400, detail="No DB loaded")
    c = state["conn"].cursor()
    c.execute("""
        SELECT file_id, path, created_at, exif_date, memory_summary, thumbnail, tags, vision_status
        FROM memories 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    """, (limit, offset))
    rows = c.fetchall()
    
    out = []
    for row in rows:
        file_id, path_val, created_at, exif_date, summary, thumbnail_blob, tags, vision_status = row
        thumb_b64 = None
        if thumbnail_blob:
            thumb_b64 = "data:image/jpeg;base64," + base64.b64encode(thumbnail_blob).decode("utf-8")
        
        out.append({
            "file_id": file_id,
            "path": path_val,
            "score": 0.0, # No score for direct listing
            "summary": summary,
            "tags": tags,
            "vision_status": vision_status,
            "exif_date": exif_date,
            "thumbnail_b64": thumb_b64
        })
    return {"results": out}

# --- Config Endpoints ---

class VisionConfig(BaseModel):
    endpoint_url: str
    model_name: str
    api_key: Optional[str] = "lm-studio"

@app.get("/config/vision")
def get_vision_config():
    if not state.get("conn"):
         # Allow getting empty config if not mounted, or raise?
         # User might want to config before mount? No, DB is in mounted path.
         raise HTTPException(status_code=400, detail="Mount drive first to configure vision")

    c = state["conn"].cursor()
    c.execute("SELECT endpoint_url, model_name, api_key FROM vision_config WHERE id=1")
    row = c.fetchone()
    if row:
        return {"endpoint_url": row[0], "model_name": row[1], "api_key": row[2]}
    return {"endpoint_url": "", "model_name": "", "api_key": ""}

@app.post("/config/vision")
def set_vision_config(cfg: VisionConfig):
    if not state.get("conn"):
        raise HTTPException(status_code=400, detail="Mount drive first")

    c = state["conn"].cursor()
    # upsert
    c.execute("INSERT OR REPLACE INTO vision_config (id, endpoint_url, model_name, api_key) VALUES (1, ?, ?, ?)",
              (cfg.endpoint_url, cfg.model_name, cfg.api_key))
    state["conn"].commit()
    return {"status": "saved"}

@app.post("/config/vision/test")
async def test_vision_config(cfg: VisionConfig):
    # Try to reach the endpoint with a simple chat message
    try:
        import httpx
        url = f"{cfg.endpoint_url.rstrip('/')}/v1/models"

        headers = {}
        if cfg.api_key and cfg.api_key.strip():
            headers["Authorization"] = f"Bearer {cfg.api_key}"

        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers=headers)

            if resp.status_code == 200:
                data = resp.json()
                return {
                    "status": "ok",
                    "details": f"Connected. Found {len(data.get('data', []))} models."
                }

            # Fallback check for Ollama base
            if "ollama" in cfg.endpoint_url:
                resp = await client.get(f"{cfg.endpoint_url.rstrip('/')}/api/tags")
                if resp.status_code == 200:
                    return {"status": "ok", "details": "Connected to Ollama."}

            return {
                "status": "error",
                "details": f"Status {resp.status_code}: {resp.text}"
            }

    except Exception as e:
        return {"status": "error", "details": str(e)}


class FilePathRequest(BaseModel):
    path: str

@app.options("/open-file")
def open_file_options():
    return {"status": "ok"}

@app.post("/open-file")
def open_file(request: FilePathRequest):
    try:
        os.startfile(request.path)
        return {
            "status": "success",
            "message": "Opened in default Windows viewer"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
