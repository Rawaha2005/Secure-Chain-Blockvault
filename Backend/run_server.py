import os
import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0" if os.getenv("PORT") else "127.0.0.1")
    reload = not bool(os.getenv("PORT"))
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload
    )

