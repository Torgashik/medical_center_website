import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="78.24.223.206",
        port=8001,
        reload=True
    ) 