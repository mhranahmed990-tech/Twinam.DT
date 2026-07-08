from pydantic import BaseModel
from typing import Dict, Union, Optional


class SensorInput(BaseModel):
    """
    Request body coming from the frontend:
    - features: dict of live sensor readings for a single robot arm (53 features).
    - unit_id: optional unit identifier (e.g. ROB-ARM-01), used only for display/logging.
    """
    features: Dict[str, Union[float, int, str]]
    unit_id: Optional[str] = None


class PredictionOutput(BaseModel):
    unit_id: Optional[str] = None
    RUL_cycles: float
    maintenance_required: int
    fault_type: str
    fault_axis: str
    health_score: float
