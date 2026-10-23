# Road Damage AI Model Weights

This directory holds the PyTorch / YOLO weights used by the FastAPI inference service.

## Expected File

- Default path: `ai-service/models/road_damage_yolov8.pt` (or specify via `MODEL_WEIGHTS_PATH` in `.env`).

## Supported Models

The engine supports:
1. **RDD2020 / RDD2022 YOLOv8 checkpoints**:
   Trained on the international Road Damage Dataset with damage classes:
   - `D00`: Longitudinal Crack (Linear crack parallel to road)
   - `D10`: Transverse Crack (Linear crack perpendicular to road)
   - `D20`: Alligator Crack (Fatigue cracking / spider-web)
   - `D40`: Pothole (Surface cavity / road depression)
   - `D43` / `D44`: Road line and crosswalk markings degradation
   - `RUTTING` / `RAVELLING`: Surface degradation and rutting

2. **Standard YOLOv8n / YOLOv8s**:
   For testing general computer vision deployments.

## Automatic Fallback

If no `.pt` file is found in this directory, the AI microservice starts up in **graceful inspection mode**:
- `/health` and `/model-info` report `model_loaded: false` and the specific missing file path.
- `/predict` returns a structured notification indicating weights are awaiting deployment and sets `review_required: true`.
- The web platform and maintenance workflows remain 100% operational, allowing inspectors to log reports, supervisors to review, and workers to accept maintenance tasks.
