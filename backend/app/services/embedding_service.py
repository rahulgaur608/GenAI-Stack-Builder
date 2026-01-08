"""
Embedding service for generating and managing vector embeddings.
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Optional
import hashlib
import os


class EmbeddingService:
    """Handles embedding generation and vector storage with ChromaDB."""

    def __init__(self, persist_directory: str = "./chroma_db"):
        self.persist_directory = persist_directory
        os.makedirs(persist_directory, exist_ok=True)
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        
        self._openai_client = None
        self._google_client = None
        self._local_model = None

    def _get_local_model(self):
        """Get or create local sentence-transformers model."""
        if self._local_model is None:
            from sentence_transformers import SentenceTransformer
            # all-MiniLM-L6-v2 is small (~90MB), fast, and good quality
            self._local_model = SentenceTransformer('all-MiniLM-L6-v2')
        return self._local_model

    def generate_embeddings_local(
        self,
        texts: List[str]
    ) -> List[List[float]]:
        """
        Generate embeddings using local sentence-transformers model.
        No API key required.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        model = self._get_local_model()
        embeddings = model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

    def _get_openai_client(self, api_key: str):
        """Get or create OpenAI client."""
        from openai import OpenAI
        return OpenAI(api_key=api_key)

    def generate_embeddings_openai(
        self,
        texts: List[str],
        api_key: str,
        model: str = "text-embedding-3-large"
    ) -> List[List[float]]:
        """
        Generate embeddings using OpenAI.
        
        Args:
            texts: List of texts to embed
            api_key: OpenAI API key
            model: Embedding model name
            
        Returns:
            List of embedding vectors
        """
        client = self._get_openai_client(api_key)
        
        # Process in batches to avoid rate limits
        batch_size = 100
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = client.embeddings.create(
                input=batch,
                model=model
            )
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)
        
        return all_embeddings

    def generate_embeddings_google(
        self,
        texts: List[str],
        api_key: str,
        model: str = "models/text-embedding-004"
    ) -> List[List[float]]:
        """
        Generate embeddings using Google Gemini.
        
        Args:
            texts: List of texts to embed
            api_key: Google API key
            model: Embedding model name
            
        Returns:
            List of embedding vectors
        """
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        all_embeddings = []
        for text in texts:
            result = genai.embed_content(
                model=model,
                content=text,
                task_type="retrieval_document"
            )
            all_embeddings.append(result['embedding'])
        
        return all_embeddings

    def create_collection(self, collection_name: str) -> chromadb.Collection:
        """
        Create or get a ChromaDB collection.
        
        Args:
            collection_name: Name of the collection
            
        Returns:
            ChromaDB collection
        """
        return self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def store_embeddings(
        self,
        collection_name: str,
        texts: List[str],
        embeddings: List[List[float]],
        metadatas: Optional[List[dict]] = None
    ) -> int:
        """
        Store embeddings in ChromaDB.
        
        Args:
            collection_name: Name of the collection
            texts: Original texts
            embeddings: Embedding vectors
            metadatas: Optional metadata for each text
            
        Returns:
            Number of documents stored
        """
        collection = self.create_collection(collection_name)
        
        # Generate unique IDs based on content hash
        ids = [
            hashlib.md5(text.encode()).hexdigest()[:16] + f"_{i}"
            for i, text in enumerate(texts)
        ]
        
        # Prepare metadata
        if metadatas is None:
            metadatas = [{"chunk_index": i} for i in range(len(texts))]
        
        # Add to collection
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )
        
        return len(texts)

    def query_similar(
        self,
        collection_name: str,
        query_embedding: List[float],
        top_k: int = 5
    ) -> List[dict]:
        """
        Query similar documents from ChromaDB.
        
        Args:
            collection_name: Name of the collection
            query_embedding: Query embedding vector
            top_k: Number of results to return
            
        Returns:
            List of similar documents with scores
        """
        try:
            collection = self.client.get_collection(collection_name)
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )
            
            documents = []
            if results and results['documents']:
                for i, doc in enumerate(results['documents'][0]):
                    documents.append({
                        "content": doc,
                        "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                        "distance": results['distances'][0][i] if results['distances'] else 0
                    })
            
            return documents
        except Exception as e:
            print(f"Error querying collection: {e}")
            return []

    def delete_collection(self, collection_name: str) -> bool:
        """Delete a collection from ChromaDB."""
        try:
            self.client.delete_collection(collection_name)
            return True
        except Exception:
            return False

    def get_collection_count(self, collection_name: str) -> int:
        """Get the number of documents in a collection."""
        try:
            collection = self.client.get_collection(collection_name)
            return collection.count()
        except Exception:
            return 0


# Singleton instance
embedding_service = EmbeddingService()
