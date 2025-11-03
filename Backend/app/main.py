"""
FastAPI main application.
"""
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import config
from app.core.exception_handlers import exception_handlers
from app.core.response import APIResponse

app = FastAPI(
    title="Symptoms Sense API",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to wrap successful JSON responses in APIResponse
@app.middleware("http")
async def wrap_success_responses(request: Request, call_next):
    response = await call_next(request)
    if isinstance(response, JSONResponse) and response.status_code < 400:
        try:
            # JSONResponse.body is bytes; decode before parsing
            data = json.loads(response.body.decode())
            if not ("status" in data and data["status"] == "success"):
                wrapped = APIResponse(message="Request successful", data=data).dict()
                response = JSONResponse(
                    status_code=response.status_code,
                    content=wrapped,
                    headers=response.headers
                )
        except (json.JSONDecodeError, TypeError):
            pass
    return response

# Register global exception handlers
for exc_class, handler in exception_handlers.items():
    app.add_exception_handler(exc_class, handler)

# Include API routes
from app.api import api_router
app.include_router(api_router)


@app.get("/")
def root():
    return APIResponse(message="Symptoms Sense API", data={"status": "running"}).dict()


@app.get("/health")
def health():
    return APIResponse(message="OK", data={"status": "healthy"}).dict()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
