import os
from pydantic import BaseModel
from typing import Dict, List

# Standard Road Damage Dataset (RDD) class definitions & severity weighting
DAMAGE_CLASS_INFO: Dict[str, Dict] = {
    "D00": {
        "name": "Longitudinal Crack",
        "description": "Linear crack running parallel to road centerline",
        "base_severity": "Low",
        "weight": 1.0,
        "required_skills": ["crack_sealing"],
        "required_equipment": ["tar_kettle", "surface_cleaner"]
    },
    "D10": {
        "name": "Transverse Crack",
        "description": "Linear crack running perpendicular to traffic flow",
        "base_severity": "Low",
        "weight": 1.1,
        "required_skills": ["crack_sealing"],
        "required_equipment": ["tar_kettle", "surface_cleaner"]
    },
    "D20": {
        "name": "Alligator Crack",
        "description": "Interconnected fatigue cracking resembling reptile skin",
        "base_severity": "High",
        "weight": 2.2,
        "required_skills": ["asphalt_patching", "subgrade_assessment"],
        "required_equipment": ["cold_planer", "compactor", "hotbox"]
    },
    "D40": {
        "name": "Pothole",
        "description": "Structural bowl-shaped depression or void in pavement surface",
        "base_severity": "High",
        "weight": 2.5,
        "required_skills": ["asphalt_patching", "emergency_filling"],
        "required_equipment": ["compactor", "hotbox", "jackhammer"]
    },
    "D43": {
        "name": "Crosswalk Blur",
        "description": "Faded or obscured pedestrian crossing striping",
        "base_severity": "Low",
        "weight": 0.8,
        "required_skills": ["thermoplastic_painting"],
        "required_equipment": ["line_striper"]
    },
    "D44": {
        "name": "White Line Blur",
        "description": "Faded or degraded lane marker markings",
        "base_severity": "Low",
        "weight": 0.7,
        "required_skills": ["thermoplastic_painting"],
        "required_equipment": ["line_striper"]
    },
    "RUTTING": {
        "name": "Wheel Rutting",
        "description": "Surface depression along wheel tracks caused by heavy wheel loads",
        "base_severity": "Medium",
        "weight": 1.8,
        "required_skills": ["surface_milling", "overlay"],
        "required_equipment": ["cold_planer", "paver", "roller"]
    },
    "RAVELLING": {
        "name": "Surface Ravelling",
        "description": "Progressive disintegration of aggregate particles from road surface",
        "base_severity": "Medium",
        "weight": 1.4,
        "required_skills": ["micro_surfacing"],
        "required_equipment": ["slurry_seal_spreader"]
    }
}

class AIServiceSettings(BaseModel):
    service_name: str = "RoadGuard AI Damage Detection Engine"
    service_version: str = "1.0.0"
    host: str = os.getenv("AI_HOST", "0.0.0.0")
    port: int = int(os.getenv("AI_PORT", "8000"))
    model_weights_path: str = os.getenv("MODEL_WEIGHTS_PATH", "models/road_damage_yolov8.pt")
    confidence_threshold: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.35"))
    review_confidence_threshold: float = float(os.getenv("REVIEW_CONFIDENCE_THRESHOLD", "0.60"))
    iou_threshold: float = float(os.getenv("IOU_THRESHOLD", "0.45"))
    device: str = os.getenv("DEVICE", "cpu")
    supported_classes: List[str] = list(DAMAGE_CLASS_INFO.keys())

settings = AIServiceSettings()
