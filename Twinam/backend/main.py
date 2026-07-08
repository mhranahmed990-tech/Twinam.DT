from pathlib import Path
from datetime import datetime, timezone
import asyncio

import httpx
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import PredictionOutput, SensorInput

app = FastAPI(
    title="Predictive Maintenance API - Twinam Digital Twin",
    description="API for predicting remaining useful life (RUL) and fault status of the industrial robot arm",
    version="1.0.0",
)

# ==========================================
# CORS
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# N8N Webhook Configuration
# ==========================================
# Replace this URL with your actual N8N webhook URL after creating it in N8N Cloud
N8N_WEBHOOK_URL = "https://your-name.app.n8n.cloud/webhook/YOUR-WEBHOOK-ID"

# Set to True to enable sending predictions to N8N
N8N_ENABLED = True

# Only send to N8N when a fault is detected or maintenance is required
# Set to False to send ALL predictions (including normal) to N8N
N8N_FAULTS_ONLY = True


async def send_to_n8n(prediction: dict, features: dict):
    """Send prediction results to N8N webhook asynchronously."""
    if not N8N_ENABLED:
        return

    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "unit_id": prediction.get("unit_id") or "UNKNOWN",
        "predictions": {
            "fault_type": prediction["fault_type"],
            "fault_axis": prediction["fault_axis"],
            "health_score": round(prediction["health_score"], 2),
            "RUL_cycles": round(prediction["RUL_cycles"], 2),
            "maintenance_required": prediction["maintenance_required"],
        },
        "sensor_snapshot": {
            "payload_mass_kg": features.get("payload_mass_kg"),
            "ambient_temp_c":  features.get("ambient_temp_c"),
            "cycle_in_run":    features.get("cycle_in_run"),
            "speed_scale":     features.get("speed_scale"),
            "cycle_time_s":    features.get("cycle_time_s"),
        },
        "alert_level": _get_alert_level(prediction),
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(N8N_WEBHOOK_URL, json=payload)
            print(f"[N8N] Sent prediction → status {response.status_code}")
    except Exception as exc:  # noqa: BLE001
        # Non-blocking — N8N errors should never break the main API response
        print(f"[N8N] Failed to send webhook: {exc}")


def _get_alert_level(prediction: dict) -> str:
    """Determine alert level based on prediction results."""
    health = prediction["health_score"]
    rul    = prediction["RUL_cycles"]
    fault  = prediction["fault_type"]

    if fault == "normal" and health >= 75:
        return "OK"
    elif fault == "normal" and health >= 50:
        return "LOW"
    elif health >= 50 and rul >= 100:
        return "MEDIUM"
    elif health >= 25 and rul >= 50:
        return "HIGH"
    else:
        return "CRITICAL"


# ==========================================
# Load Models & Encoders
# ==========================================
BASE_DIR   = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"


def _load(filename: str):
    path = MODELS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Model file not found: {path}")
    return joblib.load(path)


try:
    rul_model          = _load("main_rul_model.pkl")
    maintenance_model  = _load("main_Maintenance_Classification.pkl")
    fault_type_model   = _load("main_fault_type_model.pkl")
    fault_axis_model   = _load("main_fault_axis_model.pkl")
    health_model       = _load("main_xgb_health_model.pkl")

    fault_type_encoder = _load("main_fault_type_encoder.pkl")
    fault_axis_encoder = _load("main_fault_axis_encoder.pkl")
    feature_names      = _load("features_names.pkl")

    MODELS_LOADED      = True
    MODELS_LOAD_ERROR  = None
except Exception as exc:  # noqa: BLE001
    MODELS_LOADED     = False
    MODELS_LOAD_ERROR = str(exc)
    feature_names     = []


# ==========================================
# Sensor Config (Min / Max / Default)
# ==========================================
SENSOR_CONFIG = {
    "cycle_in_run": {"min": 0.0, "max": 24.0, "default": 0.0, "step": 1.0},
    "payload_mass_kg": {"min": 1.5848, "max": 13.2335, "default": 3.9363, "step": 0.01},
    "speed_scale": {"min": 0.3167, "max": 0.9444, "default": 0.4792, "step": 0.01},
    "cycle_time_s": {"min": 1.6623, "max": 2.8852, "default": 2.417, "step": 0.01},
    "ambient_temp_c": {"min": 17.9587, "max": 31.4658, "default": 25.038, "step": 0.01},

    "joint_1_pos_deg": {"min": -48.825663, "max": 45.214852, "default": 2.951731, "step": 0.01},
    "joint_1_vel_deg_s": {"min": -160.225684, "max": 177.905403, "default": 149.654296, "step": 0.1},
    "joint_1_acc_deg_s2": {"min": -616.443421, "max": 593.565985, "default": 2.26848, "step": 0.1},
    "joint_1_effort_nm": {"min": 3.828705, "max": 47.360707, "default": 15.612733, "step": 0.01},

    "joint_2_pos_deg": {"min": -57.468917, "max": 17.964041, "default": -14.847262, "step": 0.01},
    "joint_2_vel_deg_s": {"min": -122.280597, "max": 140.000114, "default": 121.888861, "step": 0.1},
    "joint_2_acc_deg_s2": {"min": -462.318874, "max": 581.320915, "default": -125.2876, "step": 0.1},
    "joint_2_effort_nm": {"min": 4.204682, "max": 55.461456, "default": 23.966626, "step": 0.01},

    "joint_3_pos_deg": {"min": -24.584528, "max": 66.710771, "default": 25.859824, "step": 0.01},
    "joint_3_vel_deg_s": {"min": -135.663027, "max": 162.817275, "default": 133.391891, "step": 0.1},
    "joint_3_acc_deg_s2": {"min": -1045.167204, "max": 985.837246, "default": -133.83333, "step": 0.1},
    "joint_3_effort_nm": {"min": 5.751576, "max": 95.372726, "default": 24.94897, "step": 0.01},

    "joint_4_pos_deg": {"min": -66.322682, "max": 59.819256, "default": 5.206664, "step": 0.01},
    "joint_4_vel_deg_s": {"min": -172.443747, "max": 212.092869, "default": 162.281557, "step": 0.1},
    "joint_4_acc_deg_s2": {"min": -1360.575221, "max": 1506.491414, "default": -139.617004, "step": 0.1},
    "joint_4_effort_nm": {"min": 7.804933, "max": 110.847477, "default": 23.467842, "step": 0.01},

    "joint_5_pos_deg": {"min": -30.115371, "max": 45.618151, "default": 10.636417, "step": 0.01},
    "joint_5_vel_deg_s": {"min": -95.593710, "max": 118.321664, "default": 86.879971, "step": 0.1},
    "joint_5_acc_deg_s2": {"min": -968.897110, "max": 1043.196447, "default": 66.741469, "step": 0.1},
    "joint_5_effort_nm": {"min": 4.840431, "max": 73.364720, "default": 12.894667, "step": 0.01},

    "joint_6_pos_deg": {"min": -81.957006, "max": 76.716877, "default": 5.207798, "step": 0.01},
    "joint_6_vel_deg_s": {"min": -220.753215, "max": 231.340077, "default": 189.162823, "step": 0.1},
    "joint_6_acc_deg_s2": {"min": -1026.851945, "max": 1320.552819, "default": -150.006738, "step": 0.1},
    "joint_6_effort_nm": {"min": 8.026439, "max": 76.331823, "default": 23.183949, "step": 0.01},

    "synthetic_current_j1_a": {"min": 0.502563, "max": 6.612378, "default": 3.52271, "step": 0.01},
    "synthetic_current_j2_a": {"min": 0.480255, "max": 6.895769, "default": 4.110197, "step": 0.01},
    "synthetic_current_j3_a": {"min": 0.767049, "max": 11.441520, "default": 4.343192, "step": 0.01},
    "synthetic_current_j4_a": {"min": 1.181992, "max": 13.085844, "default": 4.50384, "step": 0.01},
    "synthetic_current_j5_a": {"min": 0.784883, "max": 8.271005, "default": 2.440558, "step": 0.01},
    "synthetic_current_j6_a": {"min": 2.127814, "max": 9.217738, "default": 4.802831, "step": 0.01},

    "synthetic_temp_j1_c": {"min": 20.860370, "max": 43.433727, "default": 28.41727, "step": 0.05},
    "synthetic_temp_j2_c": {"min": 21.494284, "max": 40.364406, "default": 29.025691, "step": 0.05},
    "synthetic_temp_j3_c": {"min": 20.953869, "max": 46.780237, "default": 29.948583, "step": 0.05},
    "synthetic_temp_j4_c": {"min": 21.210996, "max": 49.692969, "default": 26.882917, "step": 0.05},
    "synthetic_temp_j5_c": {"min": 20.947152, "max": 37.907305, "default": 27.041724, "step": 0.05},
    "synthetic_temp_j6_c": {"min": 21.158927, "max": 57.177854, "default": 28.740571, "step": 0.05},

    "synthetic_vibration_j1_g": {"min": 0.0, "max": 0.266098, "default": 0.088124, "step": 0.001},
    "synthetic_vibration_j2_g": {"min": 0.0, "max": 0.090878, "default": 0.07836, "step": 0.001},
    "synthetic_vibration_j3_g": {"min": 0.0, "max": 0.476987, "default": 0.081719, "step": 0.001},
    "synthetic_vibration_j4_g": {"min": 0.0, "max": 0.288625, "default": 0.0993, "step": 0.001},
    "synthetic_vibration_j5_g": {"min": 0.0, "max": 0.085526, "default": 0.05444, "step": 0.001},
    "synthetic_vibration_j6_g": {"min": 0.0, "max": 0.306089, "default": 0.109175, "step": 0.001},

    "tracking_error_j1_deg": {"min": -0.105150, "max": 0.961845, "default": -0.012278, "step": 0.001},
    "tracking_error_j2_deg": {"min": -0.108861, "max": 0.118921, "default": 0.022788, "step": 0.001},
    "tracking_error_j3_deg": {"min": -0.378471, "max": 0.702623, "default": 0.016539, "step": 0.001},
    "tracking_error_j4_deg": {"min": -0.378608, "max": 0.394275, "default": 0.022814, "step": 0.001},
    "tracking_error_j5_deg": {"min": -0.274786, "max": 0.313626, "default": 0.031449, "step": 0.001},
    "tracking_error_j6_deg": {"min": -0.102655, "max": 0.109323, "default": 0.013498, "step": 0.001},
}


# ==========================================
# Endpoints
# ==========================================
@app.get("/")
def root():
    return {
        "service": "Twinam Predictive Maintenance API",
        "status": "ok" if MODELS_LOADED else "models_not_loaded",
        "docs": "/docs",
        "endpoints": ["/health", "/sensor_config", "/predict_all"],
        "n8n_enabled": N8N_ENABLED,
    }


@app.get("/health")
def health():
    return {
        "models_loaded": MODELS_LOADED,
        "error": MODELS_LOAD_ERROR,
        "n_features_expected": len(feature_names) if feature_names else 0,
        "n8n_enabled": N8N_ENABLED,
        "n8n_webhook_configured": N8N_WEBHOOK_URL != "https://your-name.app.n8n.cloud/webhook/YOUR-WEBHOOK-ID",
    }


@app.get("/sensor_config")
def sensor_config():
    """Returns the real sensor ranges (Min/Max/Default) for use by the frontend."""
    return SENSOR_CONFIG


@app.post("/predict_all", response_model=PredictionOutput)
async def predict_all(data: SensorInput):
    if not MODELS_LOADED:
        raise HTTPException(
            status_code=503,
            detail=f"Models are not loaded correctly: {MODELS_LOAD_ERROR}",
        )

    df = pd.DataFrame([data.features])
    df = df.reindex(columns=feature_names)

    missing = [c for c in feature_names if c not in data.features]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing features in request: {missing}",
        )

    try:
        rul_pred          = float(rul_model.predict(df)[0])
        maintenance_pred  = int(maintenance_model.predict(df)[0])

        fault_type_num    = fault_type_model.predict(df)
        fault_type_pred   = str(fault_type_encoder.inverse_transform(fault_type_num)[0])

        fault_axis_num    = fault_axis_model.predict(df)
        fault_axis_pred   = str(fault_axis_encoder.inverse_transform(fault_axis_num)[0])

        health_pred       = float(health_model.predict(df)[0])
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Error during prediction: {exc}") from exc

    result = PredictionOutput(
        unit_id=data.unit_id,
        RUL_cycles=round(rul_pred, 2),
        maintenance_required=maintenance_pred,
        fault_type=fault_type_pred,
        fault_axis=fault_axis_pred,
        health_score=round(health_pred, 4),
    )

    # ── Send to N8N (non-blocking) ──────────────────────────────────────────
    should_send = (
        not N8N_FAULTS_ONLY
        or maintenance_pred == 1
        or fault_type_pred != "normal"
    )
    if should_send:
        asyncio.create_task(
            send_to_n8n(result.model_dump(), dict(data.features))
        )

    return result
