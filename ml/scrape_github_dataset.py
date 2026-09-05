import os
import sys
import csv
import json
import time
import urllib.request

# Ensure workspace root is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.train_model import train_and_save_model, DATASET_PATH


# Target GitHub Topics mapped to PortfolioIQ Categories
TOPIC_CATEGORY_MAP = {
    # AI / Machine Learning
    "machine-learning": "AI / Machine Learning",
    "deep-learning": "AI / Machine Learning",
    "pytorch": "AI / Machine Learning",
    "tensorflow": "AI / Machine Learning",

    # Web Development
    "angular": "Web Development",
    "react": "Web Development",
    "fastapi": "Web Development",
    "django": "Web Development",
    "web-development": "Web Development",

    # Mobile Development
    "flutter": "Mobile Development",
    "react-native": "Mobile Development",
    "android": "Mobile Development",
    "ios": "Mobile Development",

    # Data Science & Analytics
    "data-science": "Data Science & Analytics",
    "pandas": "Data Science & Analytics",
    "data-visualization": "Data Science & Analytics",

    # Cloud & DevOps
    "docker": "Cloud & DevOps",
    "kubernetes": "Cloud & DevOps",
    "devops": "Cloud & DevOps",
    "terraform": "Cloud & DevOps",

    # Cybersecurity & Systems
    "cybersecurity": "Cybersecurity & Systems",
    "vulnerability-scanner": "Cybersecurity & Systems",
    "embedded": "Cybersecurity & Systems"
}

def fetch_github_repos_for_topic(topic: str, max_items: int = 15):
    """
    Fetches real public repositories from GitHub Search API for a specific topic keyword.
    Supports optional GITHUB_TOKEN environment variable for higher API rate limits.
    """
    url = f"https://api.github.com/search/repositories?q=topic:{topic}&sort=stars&order=desc&per_page={max_items}"
    headers = {
        "User-Agent": "PortfolioIQ-AI-Scraper/1.0",
        "Accept": "application/vnd.github.v3+json"
    }

    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"token {token}"

    req = urllib.request.Request(url, headers=headers)
    scraped_repos = []

    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                items = data.get('items', [])
                for item in items:
                    name = item.get('name', '')
                    desc = item.get('description', '')
                    
                    if desc and len(desc.strip()) >= 15:
                        full_text = f"{name} {desc}".strip()
                        scraped_repos.append(full_text)
    except Exception as e:
        print(f"[GitHub Scraper Warning] Failed to fetch topic '{topic}': {e}")

    return scraped_repos


def run_github_scraper():
    print("============================================================")
    print("PortfolioIQ AI -- GitHub API Dataset Scraper")
    print("============================================================")


    existing_texts = set()
    rows = []

    # Read existing CSV data if available
    if os.path.exists(DATASET_PATH):
        with open(DATASET_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('text') and row.get('category'):
                    rows.append({"text": row['text'].strip(), "category": row['category'].strip()})
                    existing_texts.add(row['text'].strip().lower())

    print(f"[GitHub Scraper] Existing dataset contains {len(rows)} samples.")
    total_added = 0

    for topic, category in TOPIC_CATEGORY_MAP.items():
        print(f"[GitHub Scraper] Fetching live top repos for topic: #{topic} -> Category: '{category}'...")
        repo_texts = fetch_github_repos_for_topic(topic, max_items=10)

        for text in repo_texts:
            if text.lower() not in existing_texts:
                rows.append({"text": text, "category": category})
                existing_texts.add(text.lower())
                total_added += 1

        # Gentle pause to respect GitHub API rate limits (10 req/min unauthenticated)
        time.sleep(2.5)


    # Save expanded CSV dataset
    with open(DATASET_PATH, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["text", "category"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n[GitHub Scraper] Successfully added {total_added} new real GitHub projects!")
    print(f"[GitHub Scraper] New Total Dataset Size: {len(rows)} rows.")
    print("============================================================\n")

    # Re-train model automatically
    print("[GitHub Scraper] Re-training ML model on updated live GitHub dataset...")
    train_and_save_model()

if __name__ == "__main__":
    run_github_scraper()
