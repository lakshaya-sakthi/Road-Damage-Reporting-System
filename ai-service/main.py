import time
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from detector import detector

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_service.api")

app = FastAPI(
    title=settings.service_name,
    version=settings.service_version,
    description="Real-time YOLO-based Road Damage Detection and Severity Analysis Microservice"
)

# Enable CORS for Express backend and dev clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()

@app.get("/", tags=["System"])
def root():
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/health", tags=["System"])
def health_check():
    """Returns microservice health, uptime, and model initialization state."""
    return {
        "status": "healthy",
        "service": settings.service_name,
        "version": settings.service_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "model_loaded": detector.is_loaded
    }

@app.get("/model-info", tags=["AI Inference"])
def model_info():
    """Retrieves metadata regarding active YOLO model weights, detection classes, and thresholds."""
    return detector.get_model_info()

@app.post("/predict", tags=["AI Inference"])
async def predict_road_damage(file: UploadFile = File(...)):
    """
    Performs road damage detection on an uploaded optical image.
    Validates file headers, executes YOLO inference (or returns structured status if weights are missing),
    evaluates severity, identifies required maintenance skills, and flags low-confidence detections.
    """
    allowed_content_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file.content_type}'. Must be JPEG, PNG, or WebP."
        )

    try:
        contents = await file.read()
        if len(contents) > 15 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Uploaded image exceeds maximum allowable size of 15MB."
            )

        result = detector.predict(contents, filename=file.filename or "upload.jpg")
        return JSONResponse(status_code=status.HTTP_200_OK, content=result)

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        logger.error(f"Inference error processing '{file.filename}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline execution error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
