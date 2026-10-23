import axios from 'axios';
import fs from 'fs';
import path from 'path';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

export const callAIInference = async (filePath, originalFilename) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Target image file not found at path: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = originalFilename.endsWith('.png')
      ? 'image/png'
      : originalFilename.endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg';

    const blob = new Blob([fileBuffer], { type: mimeType });
    const formData = new FormData();
    formData.append('file', blob, path.basename(filePath));

    const response = await axios.post(`${AI_SERVICE_URL}/predict`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 15000 // 15s timeout
    });

    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.warn(`[AI Service Call Warning]: Unable to reach AI inference service at ${AI_SERVICE_URL}: ${error.message}`);

    // If AI service is offline, return structured fallback indicating service unreachability
    // This allows system to proceed with supervisor review requirement rather than crash
    return {
      status: 'service_unavailable',
      data: {
        success: false,
        model_configured: false,
        inference_source: 'ai_service_offline',
        status_message: `AI Microservice at ${AI_SERVICE_URL} is currently unreachable (${error.message}). Report flagged for manual supervisor inspection.`,
        detections: [],
        primary_damage_type: 'Manual Review Required',
        overall_confidence: 0.0,
        calculated_severity: 'Medium',
        review_required: true,
        review_reason: 'AI Detection Microservice unreachable during ingest. Human supervisor verification required.',
        required_skills: ['asphalt_patching', 'crack_sealing'],
        required_equipment: ['compactor', 'tar_kettle'],
        technical_disclaimer:
          'AI assessment is restricted to visual surface anomalies observed in the optical image. Computer vision cannot evaluate subsurface foundation integrity.'
      }
    };
  }
};

export const getAIModelInfo = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/model-info`, { timeout: 3000 });
    return response.data;
  } catch (error) {
    return {
      model_loaded: false,
      status: 'offline',
      message: `AI service unavailable: ${error.message}`
    };
  }
};
