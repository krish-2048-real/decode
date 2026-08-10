# Arogya Sahayak — System Architecture & Technical Overview

## High-Level Architectural Flow
```
[ Rural Citizen / Patient ] 
         │
         ├── Multilingual Voice / Image / Text Triage Input
         ▼
[ Full-Stack AI Studio App (Express + Vite) ] 
         │
         ├── Clinical Triage Engine (Gemini 2.5 Flash + Clinical RAG Corpus)
         │       ├─ Evaluates red flags (gastrointestinal bleeding, chest pain, snakebite)
         │       └─ Hashes User ID (SHA-256) for zero-PII privacy protection
         │
         ├── Real-Time ASHA Dispatcher (Firestore / Local Memory fallback)
         │       └─ Emits critical emergency alerts to ASHA Field Worker Dashboard
         │
         ├── PHC Facility Geo-Locator (OpenStreetMap Overpass API + Geo-Bucket Cache)
         │       └─ Renders interactive Leaflet map with distance & 24x7 status
         │
         └── Scheme Eligibility Matcher & AI Village Bulletin Generator
                 └─ Renders localized printable bulletins in Marathi, Hindi, English
```

## Security & Privacy Architecture
1. **Zero-PII Hashing**: Citizen identity is anonymized into SHA-256 hash digests prior to storing alerts in Firestore or memory queues.
2. **Private Symptom Routing**: Sensitive health conditions (STIs, reproductive health, mental crisis) route to private, self-guided care instructions without broadcasting to public field queues.
3. **Restricted Firestore Rules**: Firestore security rules restrict write operations to validated schemas and prohibit unauthorized deletion.
