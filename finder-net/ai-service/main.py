"""
Finder-Net AI Matching Service
FastAPI-based microservice for image feature extraction and similarity matching
"""

import logging
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger('finder-net-ai')

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Finder-Net AI Service",
    description="Image-based item matching using deep learning",
    version="1.0.0"
)

# CORS Configuration
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5000').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Initialize AI components
feature_extractor = FeatureExtractor()
similarity_matcher = SimilarityMatcher()
db = Database(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# Pydantic Models
class ExtractFeaturesRequest(BaseModel):
    itemId: str
    imageUrl: str

class FindMatchesRequest(BaseModel):
    itemId: str
    imageUrl: str
    type: str  # 'lost' or 'found'
    category: str
    threshold: float = 0.7

class MatchResponse(BaseModel):
    itemId: str
    similarityScore: float
    confidence: str

# Health Check
@app.get("/")
async def root():
    return {
        "status": "success",
        "message": "Finder-Net AI Service is running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": feature_extractor.is_loaded(),
        "database_connected": db.is_connected()
    }

# Extract Features from Image
@app.post("/extract-features")
async def extract_features(request: ExtractFeaturesRequest):
    """
    Extract feature vector from item image and store in database
    """
    try:
        # Download and process image
        features = await feature_extractor.extract_from_url(request.imageUrl)
        
        # Store features in database
        await db.update_item_features(request.itemId, features.tolist())
        
        return {
            "status": "success",
            "message": "Features extracted successfully",
            "itemId": request.itemId,
            "featureDimension": len(features)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Find Matches
@app.post("/find-matches")
async def find_matches(request: FindMatchesRequest):
    """
    Find similar items using AI image matching
    """
    try:
        # Extract features from query image
        query_features = await feature_extractor.extract_from_url(request.imageUrl)
        
        # Get candidate items from database (opposite type)
        candidates = await db.get_items_by_type_and_category(
            item_type=request.type,
            category=request.category
        )
        
        # Calculate similarities
        matches = []
        for candidate in candidates:
            if candidate.get('id') == request.itemId:
                continue
                
            if not candidate.get('ai_feature_vector'):
                continue
            
            candidate_features = candidate['ai_feature_vector']
            similarity = similarity_matcher.calculate_similarity(
                query_features, 
                candidate_features
            )
            
            if similarity >= request.threshold:
                confidence = 'high' if similarity > 0.9 else 'medium' if similarity > 0.7 else 'low'
                matches.append({
                    "itemId": str(candidate['id']),
                    "similarityScore": float(similarity),
                    "confidence": confidence
                })
        
        # Sort by similarity score
        matches.sort(key=lambda x: x['similarityScore'], reverse=True)
        
        return {
            "status": "success",
            "itemId": request.itemId,
            "totalMatches": len(matches),
            "matches": matches[:10]  # Return top 10 matches
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Upload and Extract Features
@app.post("/upload-and-extract")
async def upload_and_extract(file: UploadFile = File(...)):
    """
    Upload image file and extract features
    """
    try:
        # Read image file
        contents = await file.read()
        
        # Extract features
        features = await feature_extractor.extract_from_bytes(contents)
        
        return {
            "status": "success",
            "message": "Features extracted from uploaded image",
            "featureDimension": len(features),
            "features": features.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Batch Processing
@app.post("/batch-extract")
async def batch_extract_features(items: List[ExtractFeaturesRequest]):
    """
    Extract features for multiple items in batch
    """
    try:
        results = []
        for item in items:
            try:
                features = await feature_extractor.extract_from_url(item.imageUrl)
                await db.update_item_features(item.itemId, features.tolist())
                results.append({
                    "itemId": item.itemId,
                    "status": "success"
                })
            except Exception as e:
                results.append({
                    "itemId": item.itemId,
                    "status": "failed",
                    "error": str(e)
                })
        
        return {
            "status": "success",
            "processed": len(results),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    is_dev = os.getenv("NODE_ENV", "production") != "production"
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=is_dev,
        log_level="info" if is_dev else "warning",
        workers=1 if is_dev else 2
    )
