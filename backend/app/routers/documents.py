"""
Document management API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import uuid
import os

from ..database import get_db
from ..models import Document, DocumentResponse
from ..services import document_processor, embedding_service
from ..config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    stack_id: str = Form(...),
    embedding_model: str = Form(default="text-embedding-3-large"),
    api_key: str = Form(default=""),
    chunk_size: int = Form(default=1000),
    db: Session = Depends(get_db)
):
    """
    Upload and process a document.
    
    - Extracts text from the document
    - Generates embeddings using the specified model
    - Stores embeddings in ChromaDB
    """
    # Validate file type
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in document_processor.SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Supported: {document_processor.SUPPORTED_EXTENSIONS}"
        )

    # Validate file size
    content = await file.read()
    if len(content) > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_file_size / 1024 / 1024}MB"
        )

    try:
        # Save file
        file_path = document_processor.save_file(file.filename, content)

        # Extract text
        text_content = document_processor.extract_text(file_path)

        # Chunk text
        chunks = document_processor.chunk_text(text_content, chunk_size=chunk_size)
        chunk_texts = [chunk[0] for chunk in chunks]

        # Generate collection name
        collection_name = f"stack_{stack_id.replace('-', '_')}_{uuid.uuid4().hex[:8]}"

        # Generate and store embeddings
        chunk_count = len(chunks)
        if chunk_texts:
            try:
                if api_key and embedding_model != 'local':
                    # Use OpenAI embeddings
                    embeddings = embedding_service.generate_embeddings_openai(
                        chunk_texts, api_key, embedding_model
                    )
                else:
                    # Use local embeddings (free, no API key required)
                    embeddings = embedding_service.generate_embeddings_local(chunk_texts)
                
                embedding_service.store_embeddings(
                    collection_name, chunk_texts, embeddings
                )
            except Exception as e:
                print(f"Embedding error: {e}")
                # Continue without embeddings

        # Create document record
        try:
            stack_uuid = uuid.UUID(stack_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid stack ID format")

        document = Document(
            stack_id=stack_uuid,
            filename=file.filename,
            file_path=file_path,
            file_type=ext,
            file_size=f"{len(content) / 1024:.1f} KB",
            collection_name=collection_name,
            chunk_count=str(chunk_count)
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        return document.to_dict()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{stack_id}", response_model=List[DocumentResponse])
def get_documents(stack_id: str, db: Session = Depends(get_db)):
    """Get all documents for a stack."""
    try:
        stack_uuid = uuid.UUID(stack_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid stack ID format")

    documents = db.query(Document).filter(Document.stack_id == stack_uuid).all()
    return [doc.to_dict() for doc in documents]


@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document and its embeddings."""
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format")

    document = db.query(Document).filter(Document.id == doc_uuid).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete embeddings collection
    if document.collection_name:
        embedding_service.delete_collection(document.collection_name)

    # Delete file
    document_processor.delete_file(document.file_path)

    # Delete record
    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully"}
