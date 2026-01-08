# GenAI Stack Builder - Complete Documentation

> A No-Code/Low-Code AI Workflow Builder for creating intelligent pipelines with drag-and-drop components.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Reference](#api-reference)
3. [Backend Services](#backend-services)
4. [Frontend Components](#frontend-components)
5. [Environment Configuration](#environment-configuration)
6. [Deployment Guide](#deployment-guide)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```mermaid
flowchart TB
    subgraph Frontend["Frontend (React + Vite)"]
        Dashboard[Dashboard - Stack Management]
        Builder[WorkflowBuilder - React Flow Canvas]
        Chat[ChatInterface - Query & Response]
    end

    subgraph Backend["Backend (FastAPI)"]
        API[REST API Endpoints]
        subgraph Services
            WF[WorkflowExecutor]
            LLM[LLMService]
            EMB[EmbeddingService]
            DOC[DocumentProcessor]
            WEB[WebSearchService]
        end
    end

    subgraph Storage
        PG[(PostgreSQL)]
        CHROMA[(ChromaDB)]
    end

    subgraph External["External APIs"]
        OPENAI[OpenAI / OpenRouter]
        GEMINI[Google Gemini]
        SERP[SerpAPI]
    end

    Frontend --> API
    API --> Services
    WF --> LLM & EMB
    DOC --> EMB
    LLM --> OPENAI & GEMINI
    WEB --> SERP
    EMB --> CHROMA
    API --> PG
```

### Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant ChromaDB
    participant LLM

    User->>Frontend: Create workflow & upload docs
    Frontend->>Backend: POST /api/documents/upload
    Backend->>ChromaDB: Store embeddings
    
    User->>Frontend: Ask question
    Frontend->>Backend: POST /api/execute/chat
    Backend->>ChromaDB: Query similar docs
    ChromaDB-->>Backend: Return context
    Backend->>LLM: Generate response
    LLM-->>Backend: Stream response
    Backend-->>Frontend: SSE chunks
    Frontend-->>User: Display answer
```

---

## API Reference

Base URL: `http://localhost:8000/api`

### Stacks API

#### List All Stacks
```http
GET /api/stacks
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "My AI Workflow",
    "nodes": [...],
    "edges": [...],
    "created_at": "2026-01-08T10:00:00Z",
    "updated_at": "2026-01-08T12:00:00Z"
  }
]
```

#### Create Stack
```http
POST /api/stacks
Content-Type: application/json

{
  "name": "New Stack",
  "nodes": [],
  "edges": []
}
```

#### Get Stack by ID
```http
GET /api/stacks/{id}
```

#### Update Stack
```http
PUT /api/stacks/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "nodes": [...],
  "edges": [...]
}
```

#### Delete Stack
```http
DELETE /api/stacks/{id}
```

---

### Documents API

#### Upload Document
```http
POST /api/documents/upload
Content-Type: multipart/form-data

file: <PDF/TXT/DOCX file>
stack_id: <stack UUID>
embedding_provider: "local" | "openai" | "google"
api_key: <optional, for OpenAI/Google>
```

**Response:**
```json
{
  "id": "uuid",
  "filename": "document.pdf",
  "stack_id": "uuid",
  "collection_name": "stack_uuid_docs",
  "chunk_count": 25,
  "status": "processed"
}
```

#### List Documents for Stack
```http
GET /api/documents/{stack_id}
```

#### Delete Document
```http
DELETE /api/documents/{id}
```

---

### Execution API

#### Build/Validate Workflow
```http
POST /api/execute/build
Content-Type: application/json

{
  "nodes": [...],
  "edges": [...]
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Workflow is valid and ready to execute"
}
```

#### Chat with Workflow
```http
POST /api/execute/chat
Content-Type: application/json

{
  "stack_id": "uuid",
  "query": "What is machine learning?",
  "nodes": [...],
  "edges": [...]
}
```

**Response (SSE Stream):**
```
data: {"chunk": "Machine learning is"}
data: {"chunk": " a subset of AI..."}
data: {"done": true, "metadata": {...}}
```

#### Get Chat History
```http
GET /api/execute/history/{stack_id}
```

---

## Backend Services

### LLMService

Handles LLM interactions with multiple providers.

| Provider | Supported Models |
|----------|------------------|
| OpenAI/OpenRouter | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo |
| Google Gemini | gemini-pro, gemini-1.5-flash, gemini-1.5-pro |
| Anthropic | claude-3.5-sonnet, claude-3.5-haiku, claude-3-opus |

**Usage:**
```python
from app.services import llm_service

response = await llm_service.generate_response(
    query="Explain RAG",
    context="Retrieved document content...",
    model="gpt-4o-mini",
    api_key="sk-...",
    temperature=0.7
)
```

### EmbeddingService

Generates and manages vector embeddings.

| Provider | Model | Dimensions |
|----------|-------|------------|
| Local (Free) | all-MiniLM-L6-v2 | 384 |
| OpenAI | text-embedding-3-large | 3072 |
| Google | text-embedding-004 | 768 |

**Usage:**
```python
from app.services import embedding_service

# Local embeddings (no API key needed)
embeddings = embedding_service.generate_embeddings_local(["text1", "text2"])

# Store in ChromaDB
embedding_service.store_embeddings(
    collection_name="my_docs",
    texts=["text1", "text2"],
    embeddings=embeddings
)

# Query similar
results = embedding_service.query_similar(
    collection_name="my_docs",
    query_embedding=query_emb,
    top_k=5
)
```

### DocumentProcessor

Extracts text from uploaded files.

| Format | Library |
|--------|---------|
| PDF | PyMuPDF |
| DOCX | python-docx |
| TXT | Native Python |

### WebSearchService

Optional web search via SerpAPI.

```python
from app.services import web_search_service

results = web_search_service.search(
    query="latest AI news",
    api_key="serp-api-key",
    num_results=5
)
```

---

## Frontend Components

### Component Hierarchy

```
App.jsx
├── Dashboard.jsx (Stack grid view)
└── WorkflowBuilder.jsx
    ├── ComponentPanel.jsx (Drag source)
    ├── React Flow Canvas
    │   ├── UserQueryNode.jsx
    │   ├── KnowledgeBaseNode.jsx
    │   ├── LLMEngineNode.jsx
    │   └── OutputNode.jsx
    ├── ConfigPanel.jsx (Node config)
    └── ChatInterface.jsx (Chat modal)
```

### Custom Nodes

| Node | Purpose | Connections |
|------|---------|-------------|
| **UserQueryNode** | Entry point for queries | Output only |
| **KnowledgeBaseNode** | Document upload & retrieval | Input/Output |
| **LLMEngineNode** | LLM configuration | Input/Output |
| **OutputNode** | Display responses | Input only |

### State Management

- **React useState** for local component state
- **Props drilling** for shared state
- **API calls** via `src/api/index.js`

---

## Environment Configuration

Create `backend/.env` from `.env.example`:

```bash
# Database (Required)
DATABASE_URL=postgresql://user:pass@localhost:5432/genai_stacks

# LLM Provider - Choose one:

# Option 1: OpenRouter (Recommended - unified access)
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Option 2: Direct OpenAI
OPENAI_API_KEY=sk-xxx

# Option 3: Google Gemini
GOOGLE_API_KEY=xxx

# Optional: Web Search
SERPAPI_KEY=xxx

# Storage
CHROMA_PERSIST_DIRECTORY=./chroma_db
UPLOAD_DIRECTORY=./uploads
```

### Embedding Options

| Option | Config | Cost |
|--------|--------|------|
| **Local (Default)** | No config needed | Free |
| OpenAI | Set `OPENAI_API_KEY` | $0.0001/1K tokens |
| Google | Set `GOOGLE_API_KEY` | Free tier available |

---

## Deployment Guide

### Development Mode

```bash
# Terminal 1: Frontend
cd frontend && npm install && npm run dev

# Terminal 2: Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Docker Compose (Production)

```bash
# Set environment variables
export OPENAI_API_KEY=your-key
export GOOGLE_API_KEY=your-key  # Optional

# Build and run
docker-compose up --build

# Access
# Frontend: http://localhost
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/api/docs
```

### Kubernetes (Optional)

See `k8s/` directory for Kubernetes manifests (if available).

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Failed to connect to backend" | Ensure backend is running on port 8000 |
| "Database connection failed" | Check PostgreSQL is running and `DATABASE_URL` is correct |
| "Embeddings failed" | Use "Local (Free)" option or check API key |
| "LLM request failed" | Verify API key and model selection |
| CORS errors | Backend allows `localhost:5173` by default |

### Debug Mode

Set `DEBUG=true` in `.env` for verbose logging.

### Health Check

```bash
curl http://localhost:8000/api/health
```

---

## Assignment Compliance

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| React.js Frontend | ✅ | React 18 + Vite |
| FastAPI Backend | ✅ | Python 3.11+ |
| PostgreSQL Database | ✅ | SQLAlchemy ORM |
| React Flow | ✅ | @xyflow/react v12 |
| ChromaDB Vector Store | ✅ | Persistent storage |
| OpenAI Embeddings | ✅ | + Local + Google options |
| LLM (GPT/Gemini) | ✅ | + Anthropic support |
| SerpAPI Web Search | ✅ | Optional integration |
| PyMuPDF Text Extraction | ✅ | + DOCX support |
| 4 Core Components | ✅ | UserQuery, KB, LLM, Output |
| Drag & Drop Builder | ✅ | Full React Flow canvas |
| Chat Interface | ✅ | SSE streaming responses |
| Docker Support | ✅ | docker-compose.yml |
| README | ✅ | Comprehensive guide |
| Architecture Diagram | ✅ | In this doc + README |

---

*Documentation generated: January 2026*
