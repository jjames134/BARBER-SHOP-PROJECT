from fastapi import FastAPI
from app.database import engine
from app import model
from app.model import Base

app = FastAPI()

print("Tables found:", Base.metadata.tables.keys())
Base.metadata.create_all(engine)
@app.get("/")
def root():
    return {"message":"Root"}