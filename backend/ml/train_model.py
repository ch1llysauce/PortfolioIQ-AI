import os
import csv
import joblib
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "data", "github_projects.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "project_classifier.joblib")

def load_csv_dataset():
    texts = []
    labels = []
    with open(DATASET_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('text') and row.get('category'):
                texts.append(row['text'].strip())
                labels.append(row['category'].strip())
    return texts, labels

def train_and_save_model():
    print(f"============================================================")
    print(f"PortfolioIQ AI -- Machine Learning Model Evaluation Test")
    print(f"============================================================")
    print(f"[ML Trainer] Loading open-source dataset from {DATASET_PATH}...")
    
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")
        
    texts, labels = load_csv_dataset()
    print(f"[ML Trainer] Total Samples Loaded: {len(texts)}")

    # 1. Train / Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        texts,
        labels,
        test_size=0.2,
        random_state=42,
        stratify=labels
    )

    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, stop_words='english', min_df=1)),
        ('clf', LogisticRegression(C=3.0, max_iter=1000, class_weight='balanced'))
    ])

    print(f"[ML Trainer] Fitting Scikit-Learn TF-IDF + Calibrated Logistic Regression Classifier...")
    pipeline.fit(X_train, y_train)

    # 2. Holdout Test Set Evaluation
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n1. HOLDOUT TEST SET ACCURACY (80/20 Split):")
    print(f"   Accuracy: {accuracy * 100:.2f}%")
    print("\nDetailed Classification Report (Precision, Recall, F1-Score):")
    print(classification_report(y_test, y_pred, zero_division=0))

    # 3. K-Fold Cross Validation Evaluation
    print(f"2. STRATIFIED 5-FOLD CROSS-VALIDATION ACCURACY:")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, texts, labels, cv=cv, scoring='accuracy')
    
    print(f"   Fold Scores: {[f'{score * 100:.1f}%' for score in cv_scores]}")
    print(f"   Mean CV Accuracy: {np.mean(cv_scores) * 100:.2f}% (std: +- {np.std(cv_scores) * 100:.2f}%)")

    # 4. Save Trained Model
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\nModel saved to disk: {MODEL_PATH}")
    print(f"============================================================\n")
    
    return pipeline, accuracy


if __name__ == "__main__":
    train_and_save_model()


