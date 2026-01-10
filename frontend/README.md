# Memory Brain - Frontend (Phase 2)

This is the frontend for the Memory Brain application, a local-first memory indexing system. It allows users to mount drives, scan for images, and browse memories visually.

## Tech Stack
- React
- Vite
- TypeScript
- Tailwind CSS

## Getting Started

### Prerequisites
- Node.js (v18+)
- Backend running at `http://127.0.0.1:5500`

### Installation
```bash
npm install
```

### Running the App
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## Features
- **Drive Mount:** Select and mount a local directory.
- **Scan:** Index images from the mounted drive.
- **Search:** Natural language search for memories.
- **Views:**
    - **Grid:** Standard thumbnail grid.
    - **Timeline:** Group memories by Year/Month.
    - **Chronicle:** Select memories to create a linear story view.
- **Detail View:** View full image (via `file://` or copy path fallback), summary, and OCR text.

## Phase 2 Notes & UX Debt
- **Full Image Streaming:** Currently uses `file://` protocol or path copying. A robust backend streaming endpoint is planned for Phase 4/5.
- **Global Timeline:** The timeline view currently groups *search results*. A true global timeline of all memories requires pagination APIs (Phase 4).
- **Tag Persistence:** Tag editing is not yet persisted to the backend.

## Version
v0.2.0-phase2-ui
