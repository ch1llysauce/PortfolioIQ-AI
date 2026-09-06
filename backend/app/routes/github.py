from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
from app.github.github_client import github_client

router = APIRouter(
    prefix="/api/github",
    tags=["GitHub Integration"]
)


@router.get("/status")
def get_github_status():
    """
    Checks the status and rate limit quota of the GitHub API connection.
    """
    return github_client.get_status()


@router.get("/scan/{username}")
def scan_github_user(username: str, limit: int = Query(default=30, ge=1, le=100)):
    """
    Scans a developer's public GitHub profile and repositories.
    Extracts tech stacks, skills, and classifies domains via ML.
    """
    try:
        data = github_client.scan_user(username, limit=limit)
        return data
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub scan failed: {str(e)}")

