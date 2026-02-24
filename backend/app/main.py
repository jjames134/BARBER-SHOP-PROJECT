from fastapi import FastAPI
from app.database import engine
from app import model
from app.model import Base
from app.auth import router as auth_router


app = FastAPI()

print("Tables found:", Base.metadata.tables.keys())
Base.metadata.create_all(engine)

app.include_router(auth_router)

@app.get("/")
def root():
    return {"message":"Root"}