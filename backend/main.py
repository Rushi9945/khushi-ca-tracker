from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database
import datetime

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Project Ascend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to Project Ascend API"}

@app.get("/subjects/", response_model=List[schemas.Subject])
def read_subjects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    subjects = db.query(models.Subject).offset(skip).limit(limit).all()
    return subjects

@app.get("/subjects/{subject_id}/chapters", response_model=List[schemas.Chapter])
def read_chapters(subject_id: int, db: Session = Depends(get_db)):
    chapters = db.query(models.Chapter).filter(models.Chapter.subject_id == subject_id).all()
    return chapters

class SessionLog(schemas.BaseModel):
    duration_minutes: int

@app.post("/chapters/{chapter_id}/sessions")
def log_session(chapter_id: int, session: SessionLog, db: Session = Depends(get_db)):
    db_session = models.StudySession(
        chapter_id=chapter_id,
        duration_minutes=session.duration_minutes,
        start_time=datetime.datetime.utcnow()
    )
    db.add(db_session)
    
    # Also update chapter completed status if we want, or just log time.
    # For now, just logging time.
    db.commit()
    return {"status": "success", "duration_logged": session.duration_minutes}
