import os
import joblib
from typing import Dict, Any, List, Optional
from ml.train_model import train_and_save_model, MODEL_PATH

DOMAIN_KEYWORDS = {
    "AI / Machine Learning": [
        "computer vision", "pytorch", "tensorflow", "keras", "yolo", "opencv", "deep learning",
        "machine learning", "neural network", "cnn", "rnn", "lstm", "transformer", "bert", "llm",
        "rag", "reinforcement learning", "stable diffusion", "whisper", "spacy", "scikit-learn",
        "nlp", "natural language", "ai inference", "vector storage", "embeddings", "generative ai",
        "huggingface", "transformers", "langchain", "llamaindex", "groq", "ai"
    ],
    "Web Development": [
        "angular", "react", "vue", "next.js", "nuxt", "node.js", "express", "fastapi", "django",
        "flask", "html5", "css3", "tailwind", "bootstrap", "graphql", "rest api", "websocket",
        "supabase", "postgres", "postgresql", "mongodb", "jwt", "monorepo", "saas", "frontend",
        "backend", "web", "typescript", "javascript", "html", "css", "sass", "scss", "vite", "webpack", "prisma"
    ],
    "Mobile Development": [
        "flutter", "dart", "react native", "react-native", "swift", "swiftui", "ios", "android",
        "kotlin", "jetpack compose", "expo", "camerax", "widgetkit", "coredata", "mobile app", "mobile",
        "xcode", "android studio", "ionic", "capacitor", "audioplayers"
    ],
    "Data Science & Analytics": [
        "pandas", "numpy", "scipy", "seaborn", "matplotlib", "tableau", "powerbi", "eda", "etl",
        "pyspark", "spark", "airflow", "dbt", "snowflake", "bigquery", "data science", "analytics",
        "statistics", "jupyter", "duckdb", "polars"
    ],
    "Cloud & DevOps": [
        "docker", "kubernetes", "terraform", "ansible", "ci/cd", "github actions", "aws", "gcp",
        "azure", "helm", "prometheus", "grafana", "istio", "serverless", "lambda", "devops", "cloud",
        "dockerfile", "nginx"
    ],
    "Cybersecurity & Systems": [
        "cryptography", "aes", "rsa", "kernel", "wireshark", "packet sniffer", "vulnerability",
        "firewall", "waf", "zero-trust", "malware", "penetration testing", "reverse engineering",
        "freertos", "microcontroller", "rust", "c++", "c", "assembly", "security"
    ]
}

class SavedProjectClassifier:
    """
    Production Machine Learning Classifier loading a pre-trained
    joblib model trained on open-source GitHub project datasets.
    Features title-salience weighting, tech stack integration, and hybrid multi-domain probability calibration.
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

    def predict(self, name: str, description: str = "", skills: Optional[List[str]] = None) -> Dict[str, Any]:
        if self.pipeline is None:
            self.load_or_train()

        name = (name or "").strip()
        description = (description or "").strip()
        skills_list = [s.strip() for s in (skills or []) if s and s.strip()]
        skills_text = " ".join(skills_list)
        
        # Title salience (3x) + Tech stack skills salience (3x) + Description
        combined_text = f"{name} {name} {name} {skills_text} {skills_text} {skills_text} {description}".strip()
        if not combined_text:
            return {
                "predicted_category": "Needs More Details",
                "confidence_score": 0.0,
                "probabilities": {},
                "needs_details": True
            }

        raw_probs = self.pipeline.predict_proba([combined_text])[0]
        classes = self.pipeline.classes_
        prob_dict = {cls: float(prob) for cls, prob in zip(classes, raw_probs)}

        # Keyword Domain Affinity Calibration for Hybrid Projects & Tech Stacks
        text_lower = f"{name} {name} {description} {skills_text} {skills_text} {skills_text}".lower()
        keyword_scores = {}
        for domain, kws in DOMAIN_KEYWORDS.items():
            count = sum(1 for kw in kws if kw in text_lower)
            keyword_scores[domain] = count

        total_kw = sum(keyword_scores.values())
        if total_kw > 0:
            calibrated = {}
            for c in classes:
                kw_ratio = keyword_scores.get(c, 0) / total_kw
                # 60% weight on Scikit-Learn TF-IDF Logistic Regression + 40% on Domain Keyword distribution
                calibrated[c] = 0.60 * prob_dict[c] + 0.40 * kw_ratio

            total_p = sum(calibrated.values())
            prob_dict = {c: round(p / total_p, 4) for c, p in calibrated.items()}
        else:
            prob_dict = {c: round(float(p), 4) for c, p in prob_dict.items()}

        predicted_class = max(prob_dict, key=prob_dict.get)
        confidence = prob_dict[predicted_class]

        # Confidence Threshold:
        # If highest class probability is <= 28% (flat tie or gibberish),
        # mark as "Needs More Details" instead of guessing
        if confidence <= 0.28:
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


