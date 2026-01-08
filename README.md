# GenAI Stack Builder 🚀

A **No-Code/Low-Code AI Workflow Builder** that enables users to visually create and interact with intelligent AI pipelines. Build RAG applications, connect to LLMs, and chat with your documents - all through an intuitive drag-and-drop interface.

![Dashboard Preview](./docs/dashboard.png)

## ✨ Features

- **Visual Workflow Builder**: Drag-and-drop interface using React Flow
- **4 Core Components**:
  - 🔵 **User Query**: Entry point for user questions
  - 🟣 **Knowledge Base**: Upload documents, generate embeddings, vector search
  - 🟢 **LLM Engine**: Connect to OpenAI GPT or Google Gemini
  - 🟠 **Output**: Chat interface for responses
- **Document Processing**: Extract text from PDF, TXT, and DOCX files
- **Vector Search**: ChromaDB integration for semantic document retrieval
- **Web Search**: Optional SerpAPI integration for web-augmented responses
- **Chat Interface**: Real-time chat with your configured workflow
- **Workflow Persistence**: Save and load workflows
- **Docker Support**: Full containerization with Docker Compose

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, React Flow, Lucide Icons |
| **Backend** | FastAPI, Python 3.11 |
| **Database** | PostgreSQL |
| **Vector Store** | ChromaDB |
| **LLM** | OpenAI GPT, Google Gemini |
| **Embeddings** | OpenAI Embeddings |
| **Document Processing** | PyMuPDF |
| **Web Search** | SerpAPI |
| **Containerization** | Docker, Docker Compose |

## 📁 Project Structure

```
full-stack/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── nodes/       # React Flow custom nodes
│   │   │   ├── panels/      # Sidebar panels
│   │   │   └── chat/        # Chat interface
│   │   ├── hooks/           # Custom React hooks
│   │   └── api/             # API client
│   ├── Dockerfile
│   └── package.json
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── models/          # SQLAlchemy models & Pydantic schemas
│   │   ├── routers/         # API endpoints
│   │   └── services/        # Business logic
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml        # Full stack deployment
├── IMPLEMENTATION_PLAN.md    # Detailed implementation plan
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL (or Docker)
- OpenAI API key (for embeddings and LLM)

### Option 1: Development Mode

#### 1. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`

#### 2. Start the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Run the server
uvicorn app.main:app --reload
```

Backend API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/api/docs`

### Option 2: Docker Compose (Recommended)

```bash
# Set your API keys
export OPENAI_API_KEY=your-key-here
export GOOGLE_API_KEY=your-key-here  # Optional
export SERPAPI_KEY=your-key-here     # Optional

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8000
```

## 📖 Usage Guide

### 1. Create a New Stack

1. Click **"New Stack"** on the dashboard
2. Give your stack a name

### 2. Build Your Workflow

1. **Drag components** from the left sidebar onto the canvas:
   - Start with **User Query** (entry point)
   - Add **Knowledge Base** if you want to use documents
   - Add **LLM Engine** (required for responses)
   - End with **Output** (displays results)

2. **Connect components** by dragging from output ports (green) to input ports (blue)

3. **Configure each component**:
   - Click on a node to see its properties
   - Add API keys, select models, customize prompts

### 3. Upload Documents (Optional)

1. Click the **Knowledge Base** node
2. Upload PDF, TXT, or DOCX files
3. Documents will be processed and embedded automatically

### 4. Build & Chat

1. Click **"Build Stack"** to validate your workflow
2. Click **"Chat with Stack"** to open the chat interface
3. Ask questions and get AI-powered responses!

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key (unified access) | Optional* |
| `OPENAI_API_KEY` | OpenAI API key for GPT models | Optional* |
| `GOOGLE_API_KEY` | Google API key for Gemini models | Optional* |
| `SERPAPI_KEY` | SerpAPI key for web search | No |

*At least one LLM provider is required for chat functionality.

### Supported Models

**LLM Models:**
- GPT-4o-mini (default)
- GPT-4o
- GPT-4-turbo
- GPT-3.5-turbo
- Gemini Pro / Gemini 1.5 Flash
- Claude 3.5 Sonnet / Haiku (via OpenRouter or Anthropic)

**Embedding Models:**
- 🆓 **Local** - all-MiniLM-L6-v2 (FREE, no API key needed)
- OpenAI - text-embedding-3-large
- Google - text-embedding-004

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard │ Workflow Builder (React Flow) │ Chat Interface     │
└─────────────────────────────────────────────────────────────────┘
                              ↓ REST API
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                         │
├─────────────────────────────────────────────────────────────────┤
│  Stack API │ Document API │ Execution API                        │
│                                                                  │
│  Services: DocumentProcessor │ EmbeddingService │ LLMService     │
│            WebSearchService │ WorkflowExecutor                   │
└─────────────────────────────────────────────────────────────────┘
         ↓                              ↓
┌──────────────────────┐    ┌──────────────────────┐
│     PostgreSQL       │    │      ChromaDB        │
│  (Workflow Storage)  │    │  (Vector Embeddings) │
└──────────────────────┘    └──────────────────────┘
```

## 📡 API Endpoints

### Stacks
- `GET /api/stacks` - List all stacks
- `POST /api/stacks` - Create new stack
- `GET /api/stacks/{id}` - Get stack details
- `PUT /api/stacks/{id}` - Update stack
- `DELETE /api/stacks/{id}` - Delete stack

### Documents
- `POST /api/documents/upload` - Upload and process document
- `GET /api/documents/{stack_id}` - List documents for stack
- `DELETE /api/documents/{id}` - Delete document

### Execution
- `POST /api/execute/build` - Validate workflow
- `POST /api/execute/chat` - Execute chat query
- `GET /api/execute/history/{stack_id}` - Get chat history

## 🎨 Figma Design

The UI is based on the provided Figma design:
[Figma Design Link](https://www.figma.com/design/RVtXQB4bzKSlHrtejIQqMH/Assignment--FullStack-Engineer)

## 📋 Assignment Deliverables

- ✅ Full source code (frontend + backend)
- ✅ README with setup and run instructions
- ✅ Clear component structure and modular design
- ✅ Docker configuration for deployment
- ✅ Architecture diagram

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to connect to backend" | Ensure backend is running: `uvicorn app.main:app --reload` |
| "Database connection failed" | Check PostgreSQL is running and `DATABASE_URL` is correct |
| "Embeddings failed" | Use "Local (Free)" option - no API key needed |
| "LLM request failed" | Verify your API key and selected model |
| CORS errors | Backend allows `localhost:5173` by default |

**Health Check:**
```bash
curl http://localhost:8000/api/health
```

## 🔮 Future Enhancements

- [ ] Kubernetes deployment manifests
- [ ] Prometheus + Grafana monitoring
- [ ] ELK stack for logging
- [ ] User authentication
- [ ] Workflow templates
- [ ] Additional node types (API calls, conditionals, loops)

## 📄 License

MIT License

---

Built with ❤️ for the Full-Stack Engineering Assignment
