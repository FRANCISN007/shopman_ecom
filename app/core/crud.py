from sqlalchemy.orm import Session
from app.business.models import Business


def get_business_by_slug(db: Session, slug: str):
    return db.query(Business).filter(Business.slug == slug).first()
