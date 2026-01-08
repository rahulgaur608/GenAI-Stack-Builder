"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# Node and Edge schemas
class NodePosition(BaseModel):
    x: float
    y: float


class NodeData(BaseModel):
    label: str
    type: str
    # Additional fields based on node type
    embeddingModel: Optional[str] = None
    apiKey: Optional[str] = None
    documents: Optional[List[Any]] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    prompt: Optional[str] = None
    enableWebSearch: Optional[bool] = None
    serpApiKey: Optional[str] = None
    maxTokens: Optional[int] = None
    topK: Optional[int] = None
    chunkSize: Optional[int] = None
    outputType: Optional[str] = None


class Node(BaseModel):
    id: str
    type: str
    position: NodePosition
    data: NodeData


class Edge(BaseModel):
    id: str
    source: str
    target: str


# Stack schemas
class StackBase(BaseModel):
    name: str = Field(default="Untitled Stack", max_length=255)
    description: Optional[str] = None


class StackCreate(StackBase):
    nodes: List[Node] = []
    edges: List[Edge] = []
    config: Optional[dict] = None


class StackUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[Node]] = None
    edges: Optional[List[Edge]] = None
    config: Optional[dict] = None


class StackResponse(StackBase):
    id: str
    nodes: List[Any]
    edges: List[Any]
    config: Optional[dict] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# Document schemas
class DocumentResponse(BaseModel):
    id: str
    stackId: str
    filename: str
    fileType: Optional[str] = None
    fileSize: Optional[str] = None
    collectionName: Optional[str] = None
    chunkCount: Optional[str] = None
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# Chat schemas
class ChatRequest(BaseModel):
    stack_id: str
    query: str


class ChatResponse(BaseModel):
    content: str
    sources: Optional[List[str]] = None


class ChatMessageResponse(BaseModel):
    id: str
    stackId: str
    role: str
    content: str
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# Build schemas
class BuildRequest(BaseModel):
    nodes: List[Node]
    edges: List[Edge]


class BuildResponse(BaseModel):
    valid: bool
    message: str
    errors: Optional[List[str]] = None
