from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.orders.models import Order
from app.stock.inventory.service import revert_stock

from app.core.locks import acquire_lock, release_lock, EXPIRY_LOCK_ID


# =========================================================
# ORDER EXPIRY (DISTRIBUTED SAFE - FINAL VERSION)
# =========================================================
def expire_orders(db: Session):

    # 🔒 Prevent multiple workers running same job
    if not acquire_lock(db, EXPIRY_LOCK_ID):
        return "locked"

    try:
        now = datetime.now(timezone.utc)

        orders = db.query(Order).filter(
            Order.status == "pending",
            Order.is_expired == False,
            Order.expires_at.isnot(None),
            Order.expires_at <= now
        ).all()

        processed = 0

        for order in orders:

            # 🧠 Double safety (idempotent)
            if order.is_expired:
                continue

            # -----------------------------
            # MARK ORDER EXPIRED
            # -----------------------------
            order.status = "cancelled"
            order.is_expired = True

            # -----------------------------
            # RELEASE RESERVED STOCK
            # -----------------------------
            for item in order.items:
                revert_stock(
                    db=db,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    current_user=None,
                    source="order_expiry"  # 🔥 VERY IMPORTANT
                )

            processed += 1

        db.commit()
        return processed

    finally:
        release_lock(db, EXPIRY_LOCK_ID)
