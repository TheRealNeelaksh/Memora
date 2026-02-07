// src/api/memoryApi.ts

const API_BASE = '/api'; // Uses Vite proxy

export interface Memory {
  file_id: string;
  path: string;
  score?: number;
  summary?: string;
  tags?: string;
  vision_status?: string;
  exif_date?: string;
  thumbnail_b64?: string;
  created_at?: string;
}

export interface MemoryDetail {
  file_id: string;
  path: string;
  hash: string;
  created_at: string;
  modified_at: string;
  exif_date: string;
  ocr_text: string;
  caption: string;
  memory_summary: string;
  tags: string;
  vision_json?: string;
  vision_status?: string;
}

export interface SearchResponse {
  results: Memory[];
}

export interface ScanResponse {
  status: string;
  scanned_path: string;
  new: number;
  skipped: number;
}

export interface MountResponse {
  status: string;
  db_path: string;
  count: number;
}

export interface VisionConfig {
  endpoint_url: string;
  model_name: string;
  api_key?: string;
}

export interface ConfigTestResponse {
  status: string;
  details: string;
}

export const memoryApi = {
  async health() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },

  async mountDrive(path: string): Promise<MountResponse> {
    const res = await fetch(`${API_BASE}/mount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Mount failed');
    }
    return res.json();
  },

  async scanDrive(path?: string, rescan: boolean = false): Promise<ScanResponse> {
    const res = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, rescan }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Scan failed');
    }
    return res.json();
  },

  async searchMemories(query: string, top_k: number = 12, date_from?: string, date_to?: string): Promise<SearchResponse> {
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k, date_from, date_to }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Search failed');
    }
    return res.json();
  },

  async getRecentMemories(limit: number = 50, offset: number = 0): Promise<SearchResponse> {
    const res = await fetch(`${API_BASE}/memories?limit=${limit}&offset=${offset}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to fetch memories');
    }
    return res.json();
  },

  async getMemory(file_id: string): Promise<MemoryDetail> {
    const res = await fetch(`${API_BASE}/memory/${file_id}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Get memory failed');
    }
    return res.json();
  },

  getThumbnailUrl(file_id: string): string {
    return `${API_BASE}/thumbnail/${file_id}`;
  },

  // --- Vision Config ---

  async getVisionConfig(): Promise<VisionConfig> {
    const res = await fetch(`${API_BASE}/config/vision`);
    if (!res.ok) {
      // Allow 400 if not mounted, return empty
      if (res.status === 400) return { endpoint_url: "", model_name: "" };
      throw new Error('Failed to load vision config');
    }
    return res.json();
  },

  async setVisionConfig(cfg: VisionConfig): Promise<void> {
    const res = await fetch(`${API_BASE}/config/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to save config');
    }
  },

  async testVisionConfig(cfg: VisionConfig): Promise<ConfigTestResponse> {
    const res = await fetch(`${API_BASE}/config/vision/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });

    if (!res.ok) {
      // Attempt to read JSON error detail
      try {
        const errData = await res.json();
        const msg = errData.detail || errData.details || res.statusText;
        // Normalize list of errors (Pydantic validation)
        if (Array.isArray(msg)) {
          throw new Error(msg.map((e: any) => e.msg).join(', '));
        }
        throw new Error(msg);
      } catch (e: any) {
        // If JSON parse fails or it was just thrown above
        if (e.message) throw e;
        throw new Error(`Connection test failed: ${res.status} ${res.statusText}`);
      }
    }

    return res.json();
  },

  async openFile(file_id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to open file');
    }
  }
};
