from sqlalchemy.orm import Session


from sqlalchemy import text

EXPIRY_LOCK_ID = 123456  # any unique integer


def acquire_lock(db, lock_id: int) -> bool:
    result = db.execute(
        text("SELECT pg_try_advisory_lock(:id)"),
        {"id": lock_id}
    ).scalar()

    return result


def release_lock(db, lock_id: int):
    db.execute(
        text("SELECT pg_advisory_unlock(:id)"),
        {"id": lock_id}
    )
