from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import json
from document_processor import DocumentProcessor
from graph_vector_db import CustomGraphVectorDB

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize document processor and database
document_processor = DocumentProcessor()
db = CustomGraphVectorDB({
    # Add your database connection parameters here
})

class Query(BaseModel):
    text: str
    top_k: Optional[int] = 5
    threshold: Optional[float] = 0.7

@app.post("/process-document")
async def process_document(
    file: UploadFile = File(...),
    metadata: Optional[str] = None
):
    """Process a document and store it in the database."""
    try:
        content = await file.read()
        content = content.decode("utf-8")
        
        # Parse metadata if provided
        metadata_dict = json.loads(metadata) if metadata else {}
        
        # Process the document
        result = document_processor.process_document(content, metadata_dict)
        
        # Store in database
        success = db.store_document(
            chunks=result["chunks"],
            embeddings=result["embeddings"],
            metadata=result["metadata"],
            chunk_metadata=result["chunk_metadata"]
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to store document in database")
        
        return {"message": "Document processed and stored successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query(query_data: Query):
    """Query the database using text."""
    try:
        # Generate embedding for the query
        query_embedding = document_processor.query_embedding(query_data.text)
        
        # Search the database
        results = db.query(
            query_embedding=query_embedding,
            top_k=query_data.top_k,
            threshold=query_data.threshold
        )
        
        return {"results": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/related-nodes/{node_id}")
async def get_related_nodes(
    node_id: str,
    relationship_type: Optional[str] = None
):
    """Get related nodes for a given node ID."""
    try:
        results = db.get_related_nodes(node_id, relationship_type)
        return {"results": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 