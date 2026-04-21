from apscheduler.schedulers.background import BackgroundScheduler
from app.orders.expiry_service import expire_orders
from app.database import SessionLocal


def start_scheduler():

    scheduler = BackgroundScheduler()

    def job():
        db = SessionLocal()
        try:
            expire_orders(db)
        finally:
            db.close()

    scheduler.add_job(job, "interval", minutes=30)

    scheduler.start()
