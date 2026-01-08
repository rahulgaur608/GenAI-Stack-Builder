"""
Workflow execution API routes.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Any, Optional
import uuid
import json

from ..database import get_db
from ..models import Stack, Document, ChatMessage, BuildRequest, BuildResponse, ChatRequest
from ..services import workflow_executor

router = APIRouter(prefix="/execute", tags=["Execution"])


class ExecuteRequest(BaseModel):
    stack_id: str
    query: str
    nodes: List[Any]
    edges: List[Any]


@router.post("/build", response_model=BuildResponse)
async def build_workflow(request: BuildRequest):
    """
    Validate and build a workflow.
    
    Checks that:
    - Required components are present (User Query, LLM Engine, Output)
    - Components are properly connected
    - Configuration is valid
    """
    result = workflow_executor.validate_workflow(
        [node.model_dump() for node in request.nodes],
        [edge.model_dump() for edge in request.edges]
    )
    
    return BuildResponse(
        valid=result["valid"],
        message=result["message"],
        errors=result.get("errors")
    )


@router.post("/chat")
async def execute_chat(request: ExecuteRequest, db: Session = Depends(get_db)):
    """
    Execute a chat query through the workflow with streaming response.
    """
    async def generate():
        full_content = ""
        stack_uuid = None
        try:
            stack_uuid = uuid.UUID(request.stack_id)
        except:
            pass
            
        # Get collection name if knowledge base is configured
        collection_name = None
        try:
            if stack_uuid:
                document = db.query(Document).filter(
                    Document.stack_id == stack_uuid
                ).first()
                if document:
                    collection_name = document.collection_name
        except:
            pass

        async for event in workflow_executor.execute_stream(
            query=request.query,
            nodes=request.nodes,
            edges=request.edges,
            collection_name=collection_name
        ):
            if "chunk" in event:
                full_content += event["chunk"]
            
            # Yield as JSON line
            yield json.dumps(event) + "\n"

        # Save to DB after completion
        if full_content and stack_uuid:
            try:
                # Save user message
                user_msg = ChatMessage(
                    stack_id=stack_uuid,
                    role="user",
                    content=request.query
                )
                db.add(user_msg)
                
                # Save assistant message
                asst_msg = ChatMessage(
                    stack_id=stack_uuid,
                    role="assistant",
                    content=full_content
                )
                db.add(asst_msg)
                db.commit()
            except Exception as e:
                print(f"Failed to save chat history: {e}")

    return StreamingResponse(generate(), media_type="application/x-ndjson")


@router.get("/history/{stack_id}")
def get_chat_history(stack_id: str, db: Session = Depends(get_db)):
    """Get chat history for a stack."""
    try:
        stack_uuid = uuid.UUID(stack_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid stack ID format")

    messages = db.query(ChatMessage).filter(
        ChatMessage.stack_id == stack_uuid
    ).order_by(ChatMessage.created_at).all()

    return [msg.to_dict() for msg in messages]


@router.delete("/history/{stack_id}")
def clear_chat_history(stack_id: str, db: Session = Depends(get_db)):
    """Clear chat history for a stack."""
    try:
        stack_uuid = uuid.UUID(stack_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid stack ID format")

    db.query(ChatMessage).filter(ChatMessage.stack_id == stack_uuid).delete()
    db.commit()

    return {"message": "Chat history cleared"}
