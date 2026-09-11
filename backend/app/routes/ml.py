import sys
import os
import importlib
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

# Ensure workspace root and backend root are in python path
current_dir = os.path.dirname(__file__)
workspace_root = os.path.abspath(os.path.join(current_dir, "../../../"))
backend_root = os.path.abspath(os.path.join(current_dir, "../../"))

for p in [workspace_root, backend_root]:
    if p not in sys.path:
        sys.path.insert(0, p)

import ml.classifier
importlib.reload(ml.classifier)
from ml.classifier import classifier_instance

# FastApi Router
router = APIRouter(prefix="/api/ml", tags=["machine-learning"])

class ClassifyProjectRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    skills: Optional[List[str]] = []

@router.post("/classify-project")
def classify_project(request: ClassifyProjectRequest):
    """
    Classifies a developer project using Scikit-Learn Machine Learning classifier.
    Returns predicted category, confidence percentage, and class probabilities.
    """
    result = classifier_instance.predict(request.name, request.description, request.skills)
    
    # Confidence threshold fallback:
    # If confidence is <= 30% (e.g. keyboard smash or flat tie), flag as Needs More Details
    confidence = result.get("confidence_score", 0.0)
    if confidence <= 30.0:
        result["predicted_category"] = "Needs More Details"
        result["needs_details"] = True
    
    return result


