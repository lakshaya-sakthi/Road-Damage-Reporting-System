import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from detector import detector

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "model_loaded" in data

def test_model_info_endpoint():
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "supported_classes" in data
    assert len(data["supported_classes"]) > 0
    assert "technical_disclaimer" in data

def test_predict_endpoint_valid_image():
    # Create test 100x100 RGB image
    img = Image.new("RGB", (100, 100), color="gray")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_bytes = img_byte_arr.getvalue()

    response = client.post(
        "/predict",
        files={"file": ("test_road.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "primary_damage_type" in data
    assert "calculated_severity" in data
    assert "overall_confidence" in data
    assert "technical_disclaimer" in data
    assert "required_skills" in data
    assert "required_equipment" in data

def test_predict_rejects_invalid_file_type():
    response = client.post(
        "/predict",
        files={"file": ("malicious.txt", b"plain text content", "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]
