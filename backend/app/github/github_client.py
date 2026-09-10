import os
import sys
from typing import Dict, List, Any, Optional
from collections import Counter
import httpx
import certifi
from dotenv import load_dotenv

# Load env variables for optional GITHUB_TOKEN
load_dotenv()

# Ensure parent directory is in path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from app.knowledge.entity_extractor import extract_entities_from_text
try:
    from ml.classifier import classifier_instance
    ML_AVAILABLE = True
except Exception:
    ML_AVAILABLE = False


class GitHubClient:
    BASE_URL = "https://api.github.com"

    def __init__(self):
        self._refresh_token()

    def _refresh_token(self):
        load_dotenv(override=True)
        self.token = os.getenv("GITHUB_TOKEN", "").strip()

    def _get_headers(self) -> Dict[str, str]:
        self._refresh_token()
        headers = {
            "User-Agent": "PortfolioIQ-AI/1.0",
            "Accept": "application/vnd.github.v3+json"
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def get_status(self) -> Dict[str, Any]:
        """Checks GitHub API availability and current rate limits."""
        headers = self._get_headers()
        try:
            with httpx.Client(timeout=8.0, verify=certifi.where()) as client:
                res = client.get(f"{self.BASE_URL}/rate_limit", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    core = data.get("resources", {}).get("core", {})
                    return {
                        "authenticated": bool(self.token),
                        "rate_limit_limit": core.get("limit", 60),
                        "rate_limit_remaining": core.get("remaining", 60),
                        "rate_limit_reset": core.get("reset", 0),
                        "status": "online"
                    }
        except Exception as e:
            return {
                "authenticated": bool(self.token),
                "status": "error",
                "error": str(e)
            }
        return {"authenticated": bool(self.token), "status": "unknown"}

    def scan_user(self, username: str, limit: int = 30) -> Dict[str, Any]:
        """
        Scans a public GitHub developer profile and repositories.
        Performs entity extraction, skill mapping, and ML classification.
        """
        clean_user = username.strip().lstrip("@")
        if not clean_user:
            raise ValueError("GitHub username is required.")

        headers = self._get_headers()
        
        with httpx.Client(timeout=15.0, verify=certifi.where()) as client:
            # 1. Fetch User Profile
            profile_res = client.get(f"{self.BASE_URL}/users/{clean_user}", headers=headers)
            if profile_res.status_code == 404:
                raise ValueError(f"GitHub user '{clean_user}' not found.")
            if profile_res.status_code == 403:
                raise ValueError("GitHub API rate limit exceeded. Please configure GITHUB_TOKEN in backend/.env or wait a few minutes.")
            if profile_res.status_code != 200:
                raise ValueError(f"Failed to fetch GitHub profile (Status {profile_res.status_code})")
            
            p_data = profile_res.json()
            profile = {
                "username": p_data.get("login", clean_user),
                "name": p_data.get("name") or p_data.get("login", clean_user),
                "avatar_url": p_data.get("avatar_url", ""),
                "bio": p_data.get("bio") or "Developer on GitHub",
                "public_repos": p_data.get("public_repos", 0),
                "followers": p_data.get("followers", 0),
                "following": p_data.get("following", 0),
                "html_url": p_data.get("html_url", f"https://github.com/{clean_user}"),
                "location": p_data.get("location") or "Remote",
                "blog": p_data.get("blog") or ""
            }

            # 2. Fetch User Public Repositories
            repos_url = f"{self.BASE_URL}/users/{clean_user}/repos?sort=updated&per_page={limit}"
            repos_res = client.get(repos_url, headers=headers)
            if repos_res.status_code != 200:
                repos_raw = []
            else:
                repos_raw = repos_res.json()

        parsed_repos = []
        all_skills_counter = Counter()
        lang_counter = Counter()
        total_stars = 0
        total_forks = 0

        for r in repos_raw:
            # Skip fork repos if desired, or keep them with flag
            is_fork = r.get("fork", False)
            name = r.get("name", "")
            description = r.get("description") or ""
            language = r.get("language") or "Other"
            topics = r.get("topics", [])
            stars = r.get("stargazers_count", 0)
            forks = r.get("forks_count", 0)

            total_stars += stars
            total_forks += forks
            if language and language != "Other":
                lang_counter[language] += 1

            # Combine metadata for semantic entity extraction
            combined_text = f"{name} {description} {' '.join(topics)} {language}"
            extracted = extract_entities_from_text(combined_text)
            
            detected_skills = list(set(extracted["skills"] + extracted["technologies"]))
            if language and language not in ["Other", "HTML", "CSS"]:
                if language not in detected_skills:
                    detected_skills.append(language)
            
            detected_skills.sort()

            for sk in detected_skills:
                all_skills_counter[sk] += 1

            # ML Domain Prediction
            predicted_category = "Full-Stack Web"
            confidence = 80.0
            if ML_AVAILABLE:
                try:
                    ml_result = classifier_instance.predict(name, description, detected_skills)
                    predicted_category = ml_result.get("predicted_category", "Full-Stack Web")
                    confidence = ml_result.get("confidence_score", 80.0)
                except Exception:
                    pass

            parsed_repos.append({
                "id": str(r.get("id")),
                "name": name,
                "full_name": r.get("full_name", f"{clean_user}/{name}"),
                "description": description or "No description provided.",
                "html_url": r.get("html_url", ""),
                "language": language,
                "stars": stars,
                "forks": forks,
                "topics": topics,
                "updated_at": r.get("updated_at", ""),
                "is_fork": is_fork,
                "detected_skills": detected_skills,
                "predicted_category": predicted_category,
                "confidence_score": round(confidence, 1)
            })

        # Calculate top detected skills across all repositories
        top_skills = [
            {"skill": skill, "repo_count": count}
            for skill, count in all_skills_counter.most_common(20)
        ]

        summary = {
            "total_scanned_repos": len(parsed_repos),
            "total_stars": total_stars,
            "total_forks": total_forks,
            "language_distribution": dict(lang_counter.most_common(6)),
            "top_skills": top_skills,
            "unique_skills_count": len(all_skills_counter)
        }

        return {
            "profile": profile,
            "repos": parsed_repos,
            "summary": summary
        }


# Global singleton client instance
github_client = GitHubClient()

