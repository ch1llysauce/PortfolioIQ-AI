from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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