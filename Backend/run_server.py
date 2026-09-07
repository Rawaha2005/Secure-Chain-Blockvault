import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",   # your FastAPI app location
        host="127.0.0.1", # local server
        port=8000,        # browser access port
        reload=True       # auto restart when code changes
    )

