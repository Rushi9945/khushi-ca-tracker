from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    name = Column(String)

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, index=True)
    name = Column(String)
    group = Column(String) # "Group 1", "Group 2", "Both Groups"
    
    chapters = relationship("Chapter", back_populates="subject")

class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    name = Column(String)
    is_completed = Column(Boolean, default=False)
    
    subject = relationship("Subject", back_populates="chapters")
    sessions = relationship("StudySession", back_populates="chapter")

class StudySession(Base):
    __tablename__ = "study_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    start_time = Column(DateTime, default=datetime.utcnow)
    duration_minutes = Column(Integer, default=0)
    
    chapter = relationship("Chapter", back_populates="sessions")
