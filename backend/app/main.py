from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.analytics import router as analytics_router
from app.routes.ml import router as ml_router
from app.routes.optimization import router as optimization_router
from app.routes.knowledge import router as knowledge_router
from app.routes.coach import router as coach_router
from app.routes.github import router as github_router

app = FastAPI(
    title="PortfolioIQ AI API",
    description="Backend API for PortfolioIQ AI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics_router)
app.include_router(ml_router)
app.include_router(optimization_router)
app.include_router(knowledge_router)
app.include_router(coach_router)
app.include_router(github_router)




@app.get("/")
def root():
    return {
        "message": "PortfolioIQ AI API is running!"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok"
    }
