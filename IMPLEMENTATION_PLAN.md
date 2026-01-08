# AI Workflow Builder - Implementation Plan

## 🎯 Project Overview

A No-Code/Low-Code web application for building intelligent AI workflows with drag-and-drop components.

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────┐  ┌──────────────────────┐ │
│  │  Dashboard  │  │    Workflow Builder         │  │   Chat Interface     │ │
│  │  (My Stacks)│  │  ┌────────┬───────────────┐ │  │  ┌─────────────────┐ │ │
│  │             │  │  │Sidebar │   React Flow  │ │  │  │  Message History│ │ │
│  │  • Grid     │  │  │        │   Canvas      │ │  │  │                 │ │ │
│  │  • Cards    │  │  │Components              │ │  │  │  AI Responses   │ │ │
│  │  • CRUD     │  │  └────────┴───────────────┘ │  │  └─────────────────┘ │ │
│  └─────────────┘  └─────────────────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ REST API
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (FastAPI)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                           API Endpoints                                 │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  /api/stacks     - CRUD operations for workflow stacks                 │ │
│  │  /api/documents  - Upload, process, embed documents                    │ │
│  │  /api/execute    - Execute workflow pipeline                           │ │
│  │  /api/chat       - Process chat messages through workflow              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │  Document     │  │  Embedding    │  │  LLM          │  │  Web Search  │ │
│  │  Processor    │  │  Service      │  │  Service      │  │  Service     │ │
│  │  (PyMuPDF)    │  │  (OpenAI)     │  │  (GPT/Gemini) │  │  (SerpAPI)   │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
    ┌───────────────────────────┐       ┌───────────────────────────┐
    │     PostgreSQL            │       │     ChromaDB              │
    │  ┌─────────────────────┐  │       │  ┌─────────────────────┐  │
    │  │ stacks              │  │       │  │ document_embeddings │  │
    │  │ documents           │  │       │  │ collections         │  │
    │  │ chat_history        │  │       │  └─────────────────────┘  │
    │  └─────────────────────┘  │       │                           │
    └───────────────────────────┘       └───────────────────────────┘
```

## 🔧 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + Vite | Fast development, modern tooling |
| Drag & Drop | React Flow | Node-based workflow editor |
| Styling | CSS + Lucide Icons | Clean, modern UI |
| Backend | FastAPI | High-performance async API |
| Database | PostgreSQL | Relational data storage |
| Vector Store | ChromaDB | Document embeddings |
| Text Extraction | PyMuPDF | PDF processing |
| LLM | OpenAI GPT / Gemini | Response generation |
| Embeddings | OpenAI Embeddings | Document vectorization |
| Web Search | SerpAPI | Web search integration |

## 📁 Project Structure

```
full-stack/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── nodes/           # React Flow custom nodes
│   │   │   │   ├── UserQueryNode.jsx
│   │   │   │   ├── KnowledgeBaseNode.jsx
│   │   │   │   ├── LLMEngineNode.jsx
│   │   │   │   └── OutputNode.jsx
│   │   │   ├── panels/
│   │   │   │   ├── ComponentPanel.jsx
│   │   │   │   └── ConfigPanel.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── WorkflowBuilder.jsx
│   │   │   └── ChatInterface.jsx
│   │   ├── hooks/
│   │   │   └── useWorkflow.js
│   │   ├── api/
│   │   │   └── index.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── stack.py
│   │   │   ├── document.py
│   │   │   └── chat.py
│   │   ├── routers/
│   │   │   ├── stacks.py
│   │   │   ├── documents.py
│   │   │   ├── execute.py
│   │   │   └── chat.py
│   │   ├── services/
│   │   │   ├── document_processor.py
│   │   │   ├── embedding_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── web_search_service.py
│   │   │   └── workflow_executor.py
│   │   └── utils/
│   │       └── helpers.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
├── README.md
└── IMPLEMENTATION_PLAN.md
```

## 🚀 Implementation Phases

### Phase 1: Project Setup & Core Infrastructure
- [x] Create implementation plan
- [x] Initialize frontend (Vite + React)
- [x] Initialize backend (FastAPI)
- [x] Setup PostgreSQL database schema
- [x] Setup ChromaDB connection
- [x] Docker configuration

### Phase 2: Frontend - Dashboard & Workflow Builder
- [x] Create design system (CSS variables, components)
- [x] Build Dashboard (My Stacks grid)
- [x] Implement React Flow canvas
- [x] Create custom nodes (User Query, KB, LLM, Output)
- [x] Build Component Panel (drag source)
- [x] Build Config Panel (dynamic forms)
- [x] Implement Build Stack button

### Phase 3: Backend - API & Services
- [x] Setup FastAPI with CORS
- [x] Create database models (SQLAlchemy)
- [x] Document upload & processing endpoint
- [x] Embedding service (OpenAI + Local + Google)
- [x] Vector store operations (ChromaDB)
- [x] LLM service (OpenAI/Gemini/Anthropic)
- [x] Web search service (SerpAPI)
- [x] Workflow executor logic

### Phase 4: Frontend - Chat Interface
- [x] Build chat modal UI
- [x] Message history display
- [x] Real-time response streaming
- [x] Connect to backend execute endpoint

### Phase 5: Integration & Testing
- [x] End-to-end workflow testing
- [x] Error handling & validation
- [x] Loading states & UX polish
- [x] Documentation

### Phase 6: Deployment
- [x] Dockerize frontend
- [x] Dockerize backend
- [x] Docker Compose setup
- [x] README with instructions


## 🎨 UI Design Specifications

Based on Figma design analysis:

### Color Palette
```css
--primary-green: #22C55E;    /* Build button, AI icons */
--primary-blue: #3B82F6;     /* User icons, active states */
--background: #FFFFFF;       /* Main background */
--surface: #F9FAFB;         /* Cards, panels */
--border: #E5E7EB;          /* Borders */
--text-primary: #111827;    /* Main text */
--text-secondary: #6B7280;  /* Secondary text */
```

### Component Nodes
- White cards with rounded corners (12px radius)
- Subtle drop shadow for elevation
- Input/Output ports on edges
- Curved connection lines with arrows

### Layout
- Left sidebar: 280px width
- Top bar: 64px height
- Build button: Bottom right, prominent green

## 📊 Database Schema

### stacks
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Stack name |
| nodes | JSONB | React Flow nodes data |
| edges | JSONB | React Flow edges data |
| config | JSONB | Component configurations |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

### documents
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| stack_id | UUID | Foreign key |
| filename | VARCHAR(255) | Original filename |
| file_path | VARCHAR(500) | Storage path |
| collection_name | VARCHAR(255) | ChromaDB collection |
| created_at | TIMESTAMP | Upload time |

### chat_history
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| stack_id | UUID | Foreign key |
| role | VARCHAR(50) | user/assistant |
| content | TEXT | Message content |
| created_at | TIMESTAMP | Message time |

## 🔌 API Endpoints

### Stacks
- `GET /api/stacks` - List all stacks
- `POST /api/stacks` - Create new stack
- `GET /api/stacks/{id}` - Get stack details
- `PUT /api/stacks/{id}` - Update stack
- `DELETE /api/stacks/{id}` - Delete stack

### Documents
- `POST /api/documents/upload` - Upload & process document
- `GET /api/documents/{stack_id}` - List documents for stack
- `DELETE /api/documents/{id}` - Delete document

### Execution
- `POST /api/execute/build` - Validate and build workflow
- `POST /api/execute/chat` - Process query through workflow

Let's start building! 🚀
