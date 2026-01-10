# app/faiss_mgr.py
import faiss
import numpy as np

class FaissManager:
    def __init__(self, dim):
        self.dim = dim
        self.index = faiss.IndexFlatL2(dim)
        self.ids = []  # list of tuples (file_id, path)

    def reset(self):
        self.index = faiss.IndexFlatL2(self.dim)
        self.ids = []

    def build_from_db(self, conn):
        c = conn.cursor()
        c.execute("SELECT file_id, path, embedding FROM memories")
        rows = c.fetchall()
        vecs = []
        self.ids = []
        for fid, path, emb_blob in rows:
            if emb_blob:
                arr = np.frombuffer(emb_blob, dtype=np.float32)
                if arr.size == self.dim:
                    vecs.append(arr)
                    self.ids.append((fid, path))
        if vecs:
            mat = np.vstack(vecs).astype("float32")
            self.index.reset()
            self.index.add(mat)
        else:
            self.reset()

    def add_vector(self, vec, id_tuple):
        # vec: numpy float32 vector
        if vec is None:
            return
        if hasattr(vec, "reshape"):
            arr = np.array(vec).astype("float32").reshape(1, -1)
        else:
            arr = np.array(vec, dtype="float32").reshape(1, -1)
        if self.index.ntotal == 0:
            self.index.add(arr)
            self.ids.append(id_tuple)
        else:
            # append to index. IndexFlatL2 supports add
            self.index.add(arr)
            self.ids.append(id_tuple)

    def search(self, qvec, topk=10):
        if self.index.ntotal == 0:
            return []
        D, I = self.index.search(np.array([qvec]).astype("float32"), topk)
        results = []
        for dist, idx in zip(D[0], I[0]):
            if idx == -1:
                continue
            fid, path = self.ids[idx]
            results.append({"file_id": fid, "path": path, "score": float(dist)})
        return results
