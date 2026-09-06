import os
import joblib
from typing import Dict, Any
from ml.train_model import train_and_save_model, MODEL_PATH

class SavedProjectClassifier:
    """
    Production Machine Learning Classifier loading a pre-trained
    joblib model trained on open-source GitHub project datasets.
    """
    def __init__(self):
        self.pipeline = None
        self.load_or_train()

    def load_or_train(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.pipeline = joblib.load(MODEL_PATH)
                print(f"[ML Classifier] Successfully loaded pre-trained joblib model from {MODEL_PATH}")
                return
            except Exception as e:
                print(f"[ML Classifier] Error loading saved model: {e}. Re-training...")

        # Fallback: train and save
        self.pipeline, _ = train_and_save_model()

    def predict(self, name: str, description: str) -> Dict[str, Any]:
        if self.pipeline is None:
            self.load_or_train()

        combined_text = f"{name} {description}".strip()
        if not combined_text:
            return {
                "predicted_category": "Needs More Details",
                "confidence_score": 0.0,
                "probabilities": {},
                "needs_details": True
            }

        predicted_class = self.pipeline.predict([combined_text])[0]
        probs = self.pipeline.predict_proba([combined_text])[0]
        classes = self.pipeline.classes_

        prob_dict = {
            cls: round(float(prob), 4)
            for cls, prob in zip(classes, probs)
        }

        confidence = prob_dict.get(predicted_class, 0.5)

        # Confidence Threshold:
        # If highest class probability is <= 30% (flat tie or gibberish with no vocabulary matches),
        # mark as "Needs More Details" instead of blindly guessing a domain
        if confidence <= 0.30:
            return {
                "predicted_category": "Needs More Details",
                "confidence_score": round(confidence * 100, 1),
                "probabilities": prob_dict,
                "needs_details": True
            }

        return {
            "predicted_category": predicted_class,
            "confidence_score": round(confidence * 100, 1),
            "probabilities": prob_dict,
            "needs_details": False
        }

# Singleton instance
classifier_instance = SavedProjectClassifier()
