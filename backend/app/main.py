from fastapi import FastAPI
from app.database import engine
from app import model
from app.model import Base
from app.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins="http://localhost:5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Tables found:", Base.metadata.tables.keys())
Base.metadata.create_all(engine)

app.include_router(auth_router)

@app.get("/")
def root():
    return {"message":"Root"}