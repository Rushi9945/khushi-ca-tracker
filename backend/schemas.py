from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChapterBase(BaseModel):
    name: str
    is_completed: bool = False

class ChapterCreate(ChapterBase):
    pass

class Chapter(ChapterBase):
    id: int
    subject_id: int
    
    class Config:
        from_attributes = True

class SubjectBase(BaseModel):
    code: str
    name: str
    group: str

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: int
    chapters: List[Chapter] = []

    class Config:
        from_attributes = True
