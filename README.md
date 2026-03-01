# MedOS — Clinical Command Center

A modular clinical workflow system designed for GP practices in Lagos, London, and Toronto.

## What's Inside

| File | Description |
|------|-------------|
| `MedOS.jsx` | React frontend v1 — 5-layer clinical interface |
| `MedOS_v2.jsx` | React frontend v2 — Confirmation Loop + Voice Engine |
| `medos_schema.sql` | Production PostgreSQL schema (NDPR/GDPR/PIPEDA compliant) |
| `MedOS_Architecture.docx` | Full technical architecture blueprint |

## Layers

1. **Smart Clinical Notebook** — SOAP templates, voice-to-structured-note
2. **Follow-Up Engine** — Risk-stratified patient tracking + SMS reminders
3. **Knowledge Graph** — Clinical pearls with auto-linking
4. **Decision Support** — CURB-65, CHA₂DS₂-VASc, dose calculator
5. **Performance Dashboard** — Analytics from structured clinical data

## Stack

- Frontend: React 18
- Backend (planned): Node.js + PostgreSQL
- Voice Engine (planned): FastAPI + Whisper v3

## Status

🚧 Active development — UI complete
