import os
import io
import logging
from typing import Dict, List, Optional, Tuple
from PIL import Image
from config import settings, DAMAGE_CLASS_INFO

logger = logging.getLogger("ai_service.detector")

DISCLAIMER_TEXT = (
    "AI assessment is restricted to visual surface anomalies observed in the submitted optical image. "
    "Image-only computer vision cannot ascertain subsurface base/subgrade failure, voids beneath asphalt, "
    "or exact physical pothole cavity depth without specialized ground penetrating radar (GPR) or physical depth gauges."
)

class RoadDamageDetector:
    def __init__(self):
        self.model = None
        self.weights_path = settings.model_weights_path
        self.is_loaded = False
        self.load_error: Optional[str] = None
        self.init_detector()

    def init_detector(self):
        """Attempts to load real YOLO model weights using ultralytics if present."""
        if not os.path.exists(self.weights_path):
            self.is_loaded = False
            self.load_error = (
                f"Model weights file not found at '{self.weights_path}'. "
                f"Please place a valid YOLOv8/RDD model checkpoint (.pt) in the models/ directory "
                f"and set MODEL_WEIGHTS_PATH accordingly."
            )
            logger.warning(self.load_error)
            return

        try:
            from ultralytics import YOLO
            logger.info(f"Loading YOLO model from: {self.weights_path}")
            self.model = YOLO(self.weights_path)
            self.is_loaded = True
            self.load_error = None
            logger.info("YOLO Road Damage Detection model loaded successfully.")
        except Exception as e:
            self.is_loaded = False
            self.load_error = f"Failed to initialize YOLO model: {str(e)}"
            logger.error(self.load_error)

    def get_model_info(self) -> Dict:
        return {
            "model_loaded": self.is_loaded,
            "model_type": "YOLOv8-RoadDamage" if self.is_loaded else "Unloaded (Awaiting Weights)",
            "weights_path": self.weights_path,
            "weights_exist": os.path.exists(self.weights_path),
            "supported_classes": [
                {"code": code, "name": meta["name"], "base_severity": meta["base_severity"]}
                for code, meta in DAMAGE_CLASS_INFO.items()
            ],
            "confidence_threshold": settings.confidence_threshold,
            "review_confidence_threshold": settings.review_confidence_threshold,
            "device": settings.device,
            "load_error": self.load_error,
            "technical_disclaimer": DISCLAIMER_TEXT
        }

    def calculate_severity(self, detections: List[Dict], img_w: int, img_h: int) -> Tuple[str, float, bool]:
        """
        Determines overall severity based on detected road damage types, 
        area footprint, and multiplicity.
        
        Severity levels:
        - Low: Minor surface blemishes, fine longitudinal cracks, faint lane marking
        - Medium: Transverse cracking, moderate ravelling, shallow wheel rutting
        - High: Extensive alligator cracking, deep structural crack network, moderate pothole
        - Critical: Large/multiple potholes, severe pavement collapse risk
        
        Returns: (severity_label, overall_confidence, review_required)
        """
        if not detections:
            return "Low", 0.0, False

        total_image_area = max(1, img_w * img_h)
        total_damage_score = 0.0
        confidences = []
        has_pothole = False
        has_alligator = False
        pothole_count = 0
        total_bbox_area = 0

        for det in detections:
            conf = det.get("confidence", 0.0)
            confidences.append(conf)
            label = det.get("class_code", "")
            meta = DAMAGE_CLASS_INFO.get(label, {
                "base_severity": "Medium",
                "weight": 1.0,
                "name": det.get("class_name", "Unknown")
            })

            box = det.get("box", {})
            w = max(0, box.get("xmax", 0) - box.get("xmin", 0))
            h = max(0, box.get("ymax", 0) - box.get("ymin", 0))
            box_area = w * h
            total_bbox_area += box_area

            # Weight score by severity multiplier and relative surface area
            area_ratio = min(1.0, (box_area / total_image_area) * 10) # normalized scale
            damage_factor = meta.get("weight", 1.0)
            total_damage_score += (damage_factor * 1.5) + (area_ratio * 3.0)

            if label == "D40" or "Pothole" in meta.get("name", ""):
                has_pothole = True
                pothole_count += 1
            if label == "D20" or "Alligator" in meta.get("name", ""):
                has_alligator = True

        overall_confidence = float(sum(confidences) / len(confidences)) if confidences else 0.0

        # Review required if average or any key confidence is below the review threshold
        review_required = (overall_confidence < settings.review_confidence_threshold) or any(
            c < 0.50 for c in confidences
        )

        # Categorize severity based on cumulative weighted damage score
        if pothole_count >= 2 or total_damage_score >= 6.5 or (has_pothole and total_bbox_area / total_image_area > 0.08):
            severity = "Critical"
        elif has_pothole or has_alligator or total_damage_score >= 3.8:
            severity = "High"
        elif total_damage_score >= 1.8:
            severity = "Medium"
        else:
            severity = "Low"

        return severity, round(overall_confidence, 4), review_required

    def predict(self, image_bytes: bytes, filename: str = "upload.jpg") -> Dict:
        """Runs inference on image bytes."""
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_w, img_h = image.size
        except Exception as e:
            raise ValueError(f"Invalid image format: {str(e)}")

        detections: List[Dict] = []
        inference_source = "real_yolo_weights" if self.is_loaded else "unconfigured_weights_fallback"

        if self.is_loaded and self.model is not None:
            # Real YOLO inference execution
            results = self.model.predict(
                source=image,
                conf=settings.confidence_threshold,
                iou=settings.iou_threshold,
                device=settings.device,
                verbose=False
            )
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    xyxy = box.xyxy[0].tolist()
                    class_name = self.model.names.get(cls_id, f"Class_{cls_id}")
                    # Map to known RDD codes if name matches, else default
                    matching_code = next(
                        (k for k, v in DAMAGE_CLASS_INFO.items() if v["name"].lower() in class_name.lower() or k == class_name),
                        "D40" if "pothole" in class_name.lower() else "D00"
                    )
                    meta = DAMAGE_CLASS_INFO.get(matching_code, DAMAGE_CLASS_INFO["D00"])

                    detections.append({
                        "class_code": matching_code,
                        "class_name": meta["name"],
                        "confidence": round(conf, 4),
                        "box": {
                            "xmin": round(xyxy[0], 1),
                            "ymin": round(xyxy[1], 1),
                            "xmax": round(xyxy[2], 1),
                            "ymax": round(xyxy[3], 1)
                        },
                        "required_skills": meta["required_skills"],
                        "required_equipment": meta["required_equipment"]
                    })
        else:
            # Real fallback when model weights are not loaded.
            # Clearly flag model_configured: False so API and UI accurately display status
            # As per requirements: "If compatible model weights are unavailable, create the real inference integration,
            # provide the expected model configuration, explain the missing dependency, and clearly mark inference as unavailable until configured."
            logger.info("Weights not yet configured. Providing structured placeholder response.")
            # We perform real image dimensions check & return clean status
            severity, overall_conf, review_required = "Medium", 0.0, True
            return {
                "success": True,
                "model_configured": False,
                "inference_source": "weights_unavailable",
                "status_message": (
                    f"Model weights file '{self.weights_path}' is not present. "
                    f"Real inference integration is ready and waiting for YOLOv8 weights. "
                    f"Report marked for Supervisor Review."
                ),
                "image_dimensions": {"width": img_w, "height": img_h},
                "detections": [],
                "primary_damage_type": "Pending Verification",
                "overall_confidence": 0.0,
                "calculated_severity": "Medium",
                "review_required": True,
                "review_reason": "Inference model weights not loaded on host. Human supervisor confirmation mandatory.",
                "required_skills": ["asphalt_patching", "crack_sealing"],
                "required_equipment": ["compactor", "tar_kettle"],
                "technical_disclaimer": DISCLAIMER_TEXT
            }

        # Calculate severity and review status from detections
        severity, overall_conf, review_required = self.calculate_severity(detections, img_w, img_h)

        # Determine primary damage type
        primary_damage = "Undetermined Surface"
        skills = []
        equipment = []
        if detections:
            # Pick damage type with highest severity weight / confidence
            sorted_dets = sorted(
                detections,
                key=lambda d: (
                    DAMAGE_CLASS_INFO.get(d["class_code"], {}).get("weight", 1.0),
                    d["confidence"]
                ),
                reverse=True
            )
            primary_damage = sorted_dets[0]["class_name"]
            for d in detections:
                skills.extend(d.get("required_skills", []))
                equipment.extend(d.get("required_equipment", []))

        return {
            "success": True,
            "model_configured": True,
            "inference_source": inference_source,
            "status_message": "Real YOLO model inference successfully performed.",
            "image_dimensions": {"width": img_w, "height": img_h},
            "detections": detections,
            "primary_damage_type": primary_damage,
            "overall_confidence": overall_conf,
            "calculated_severity": severity,
            "review_required": review_required,
            "review_reason": (
                "Detection confidence score is below safe operational threshold (60%). Supervisor verification recommended."
                if review_required else None
            ),
            "required_skills": list(set(skills)) or ["asphalt_patching"],
            "required_equipment": list(set(equipment)) or ["compactor"],
            "technical_disclaimer": DISCLAIMER_TEXT
        }

# Global singleton detector instance
detector = RoadDamageDetector()
