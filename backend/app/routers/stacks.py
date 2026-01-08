"""
Stack management API routes.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models import Stack, StackCreate, StackUpdate, StackResponse

router = APIRouter(prefix="/stacks", tags=["Stacks"])


@router.get("", response_model=List[StackResponse])
def get_stacks(db: Session = Depends(get_db)):
    """Get all stacks."""
    stacks = db.query(Stack).order_by(Stack.updated_at.desc()).all()
    return [stack.to_dict() for stack in stacks]


@router.get("/{stack_id}", response_model=StackResponse)
def get_stack(stack_id: str, db: Session = Depends(get_db)):
    """Get a specific stack by ID."""
    try:
        stack_uuid = uuid.UUID(stack_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid stack ID format")
    
    stack = db.query(Stack).filter(Stack.id == stack_uuid).first()
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")
    
    return stack.to_dict()


@router.post("", response_model=StackResponse)
def create_stack(stack_data: StackCreate, db: Session = Depends(get_db)):
    """Create a new stack."""
    stack = Stack(
        name=stack_data.name,
        description=stack_data.description,
        nodes=[node.model_dump() for node in stack_data.nodes],
        edges=[edge.model_dump() for edge in stack_data.edges],
        config=stack_data.config
    )
    
    db.add(stack)
    db.commit()
    db.refresh(stack)
    
    return stack.to_dict()


@router.put("/{stack_id}", response_model=StackResponse)
def update_stack(stack_id: str, stack_data: StackUpdate, db: Session = Depends(get_db)):
    """Update an existing stack."""
    try:
        stack_uuid = uuid.UUID(stack_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid stack ID format")
    
    stack = db.query(Stack).filter(Stack.id == stack_uuid).first()
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")
    
    # Update fields if provided
    if stack_data.name is not None:
        stack.name = stack_data.name
    if stack_data.description is not None:
        stack.description = stack_data.description
    if stack_data.nodes is not None:
        stack.nodes = [node.model_dump() for node in stack_data.nodes]
    if stack_data.edges is not None:
        stack.edges = [edge.model_dump() for edge in stack_data.edges]
    if stack_data.config is not None:
        stack.config = stack_data.config
    
    db.commit()
    db.refresh(stack)
    
    return stack.to_dict()


@router.delete("/{stack_id}")
def delete_stack(stack_id: str, db: Session = Depends(get_db)):
    """Delete a stack."""
    try:
        stack_uuid = uuid.UUID(stack_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid stack ID format")
    
    stack = db.query(Stack).filter(Stack.id == stack_uuid).first()
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")
    
    db.delete(stack)
    db.commit()
    
    return {"message": "Stack deleted successfully"}
