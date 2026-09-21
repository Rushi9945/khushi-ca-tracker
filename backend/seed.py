from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    subjects = [
        {"code": "FR", "name": "Financial Reporting", "group": "Group 1"},
        {"code": "AFM", "name": "Advanced Financial Management", "group": "Group 1"},
        {"code": "AUD", "name": "Advanced Auditing, Assurance and Professional Ethics", "group": "Group 1"},
        {"code": "DT", "name": "Direct Tax Laws & International Taxation", "group": "Group 2"},
        {"code": "IDT", "name": "Indirect Tax Laws", "group": "Group 2"},
        {"code": "IBS", "name": "Integrated Business Solutions", "group": "Group 2"},
        {"code": "SPOM-A", "name": "Corporate and Economic Laws", "group": "Both Groups"},
        {"code": "SPOM-B", "name": "Costing & Performance", "group": "Both Groups"},
        {"code": "SPOM-C", "name": "Elective", "group": "Both Groups"},
        {"code": "SPOM-D", "name": "Elective", "group": "Both Groups"},
    ]
    
    for sub_data in subjects:
        existing = db.query(models.Subject).filter(models.Subject.code == sub_data["code"]).first()
        if not existing:
            subject = models.Subject(**sub_data)
            db.add(subject)
            
    db.commit()
    db.close()
    print("Database seeded with CA Final subjects.")

if __name__ == "__main__":
    seed_data()
