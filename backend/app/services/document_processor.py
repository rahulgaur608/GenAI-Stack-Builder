"""
Document processing service for extracting text from uploaded files.
"""
import fitz  # PyMuPDF
import os
from typing import List, Tuple


class DocumentProcessor:
    """Handles document processing and text extraction."""

    SUPPORTED_EXTENSIONS = {'.pdf', '.txt', '.doc', '.docx'}

    def __init__(self, upload_dir: str = "./uploads"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)

    def extract_text(self, file_path: str) -> str:
        """
        Extract text content from a document.
        
        Args:
            file_path: Path to the document file
            
        Returns:
            Extracted text content
        """
        ext = os.path.splitext(file_path)[1].lower()

        if ext == '.pdf':
            return self._extract_from_pdf(file_path)
        elif ext == '.txt':
            return self._extract_from_txt(file_path)
        elif ext in {'.doc', '.docx'}:
            return self._extract_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using PyMuPDF."""
        text_content = []
        
        with fitz.open(file_path) as doc:
            for page in doc:
                text_content.append(page.get_text())
        
        return "\n\n".join(text_content)

    def _extract_from_txt(self, file_path: str) -> str:
        """Extract text from plain text file."""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()

    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from Word document."""
        try:
            from docx import Document
            doc = Document(file_path)
            return "\n\n".join([para.text for para in doc.paragraphs])
        except ImportError:
            raise ImportError("python-docx is required for Word document processing")

    def chunk_text(
        self, 
        text: str, 
        chunk_size: int = 1000, 
        overlap: int = 200
    ) -> List[Tuple[str, int]]:
        """
        Split text into overlapping chunks.
        
        Args:
            text: Text to split
            chunk_size: Maximum characters per chunk
            overlap: Number of overlapping characters between chunks
            
        Returns:
            List of (chunk_text, chunk_index) tuples
        """
        chunks = []
        start = 0
        chunk_index = 0

        while start < len(text):
            end = start + chunk_size
            
            # Try to break at sentence or paragraph boundary
            if end < len(text):
                # Look for paragraph break
                para_break = text.rfind('\n\n', start, end)
                if para_break > start + chunk_size // 2:
                    end = para_break + 2
                else:
                    # Look for sentence break
                    for delimiter in ['. ', '! ', '? ', '\n']:
                        sent_break = text.rfind(delimiter, start, end)
                        if sent_break > start + chunk_size // 2:
                            end = sent_break + len(delimiter)
                            break

            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append((chunk_text, chunk_index))
                chunk_index += 1

            start = end - overlap

        return chunks

    def save_file(self, filename: str, content: bytes) -> str:
        """
        Save uploaded file to disk.
        
        Args:
            filename: Name of the file
            content: File content as bytes
            
        Returns:
            Path to saved file
        """
        # Sanitize filename
        safe_filename = "".join(c for c in filename if c.isalnum() or c in '._-')
        file_path = os.path.join(self.upload_dir, safe_filename)
        
        # Handle duplicate filenames
        base, ext = os.path.splitext(file_path)
        counter = 1
        while os.path.exists(file_path):
            file_path = f"{base}_{counter}{ext}"
            counter += 1

        with open(file_path, 'wb') as f:
            f.write(content)

        return file_path

    def delete_file(self, file_path: str) -> bool:
        """Delete a file from disk."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception:
            return False


# Singleton instance
document_processor = DocumentProcessor()
