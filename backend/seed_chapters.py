from database import SessionLocal, engine
import models

def seed_chapters():
    db = SessionLocal()
    
    # Get FR subject
    fr = db.query(models.Subject).filter(models.Subject.code == "FR").first()
    if fr and not db.query(models.Chapter).filter(models.Chapter.subject_id == fr.id).first():
        chapters = [
            "Ch 1: Introduction to Ind AS",
            "Ch 2: Presentation of Financial Statements",
            "Ch 3: Revenue from Contracts with Customers",
            "Ch 4: Leases (Ind AS 116)",
            "Ch 5: Consolidation of Financial Statements"
        ]
        for name in chapters:
            db.add(models.Chapter(subject_id=fr.id, name=name))

    # Get AFM subject
    afm = db.query(models.Subject).filter(models.Subject.code == "AFM").first()
    if afm and not db.query(models.Chapter).filter(models.Chapter.subject_id == afm.id).first():
        chapters = [
            "Ch 1: Financial Policy and Corporate Strategy",
            "Ch 2: Risk Management",
            "Ch 3: Advanced Capital Budgeting Decisions",
            "Ch 4: Security Analysis",
            "Ch 5: Portfolio Management"
        ]
        for name in chapters:
            db.add(models.Chapter(subject_id=afm.id, name=name))

    db.commit()
    db.close()
    print("Seeded chapters for FR and AFM.")

if __name__ == "__main__":
    seed_chapters()
