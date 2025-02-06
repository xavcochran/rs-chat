from typing import List, Dict, Any
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import os
import json
from bs4 import BeautifulSoup
import re

class DocumentProcessor:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        self.embedding_model = SentenceTransformer(model_name)
    
    def process_markdown(self, content: str) -> str:
        """Clean markdown content and extract plain text."""
        # Remove code blocks
        content = re.sub(r'```[\s\S]*?```', '', content)
        # Remove inline code
        content = re.sub(r'`[^`]*`', '', content)
        # Convert to plain text
        soup = BeautifulSoup(content, 'html.parser')
        return soup.get_text()
    
    def chunk_document(self, text: str) -> List[str]:
        """Split document into chunks."""
        return self.text_splitter.split_text(text)
    
    def generate_embeddings(self, chunks: List[str]) -> List[List[float]]:
        """Generate embeddings for text chunks."""
        return self.embedding_model.encode(chunks).tolist()
    
    def process_document(self, content: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process a document: clean, chunk, and generate embeddings."""
        cleaned_text = self.process_markdown(content)
        chunks = self.chunk_document(cleaned_text)
        embeddings = self.generate_embeddings(chunks)
        
        return {
            "chunks": chunks,
            "embeddings": embeddings,
            "metadata": metadata or {},
            "chunk_metadata": [
                {
                    "index": i,
                    "text": chunk,
                    "char_length": len(chunk)
                }
                for i, chunk in enumerate(chunks)
            ]
        }

    def query_embedding(self, query: str) -> List[float]:
        """Generate embedding for a query."""
        return self.embedding_model.encode(query).tolist() 