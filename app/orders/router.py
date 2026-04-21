from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.orders.schemas import OrderCreate
from app.orders.service import create_order
from app.orders.models import Order

from app.stock.inventory.service import revert_stock

from app.sales.schemas import SaleFullCreate, SaleItemData


from typing import List, Optional

from app.orders import service, schemas
from app.users.permissions import role_required
from app.users.schemas import UserDisplaySchema

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

LAGOS_TZ = ZoneInfo("Africa/Lagos")

router = APIRouter()


@router.post("/public/orders", status_code=201)
def place_order(
    data: OrderCreate,
    db: Session = Depends(get_db)
):
    order = create_order(db, data, data.slug)   # ✅ FIX HERE

    return {
        "message": "Order created successfully",
        "data": {
            "id": order.id,   # ✅ ADD THIS
            "reference": order.reference,
            "total_amount": order.total_amount,
            "status": order.status,
            "payment_status": order.payment_status
        }
    }



# -----------------------------
# LIST ORDERS (ADMIN)
# -----------------------------
@router.get("/", response_model=List[schemas.OrderOut])
def list_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserDisplaySchema = Depends(
        role_required(["manager", "admin", "super_admin"])
    ),
):
    return service.list_orders(db, current_user, status)


# -----------------------------
# GET SINGLE ORDER
# -----------------------------
@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: UserDisplaySchema = Depends(
        role_required(["manager", "admin", "super_admin"])
    ),
):
    order = service.get_order(db, order_id, current_user)

    if not order:
        raise HTTPException(404, "Order not found")

    return order



# -----------------------------
# UPDATE ORDER (FULL)
# -----------------------------
@router.put("/{order_id}")
def update_order(
    order_id: int,
    data: schemas.OrderUpdate,
    db: Session = Depends(get_db),
    current_user: UserDisplaySchema = Depends(
        role_required(["manager", "admin", "super_admin"])
    ),
):
    return service.update_order(db, order_id, data, current_user)




# -----------------------------
# UPDATE ORDER STATUS
# -----------------------------
@router.patch("/{order_id}/status")
def update_order_status(
    order_id: int,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: UserDisplaySchema = Depends(
        role_required(["manager", "admin", "super_admin"])
    ),
):
    return service.update_order_status(
        db, order_id, payload.status, current_user
    )



# -----------------------------
# CONVERT ORDER TO SALE
# -----------------------------
@router.post("/{order_id}/convert-to-sale")
def convert_order_to_sale(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: UserDisplaySchema = Depends(
        role_required(["manager", "user",  "admin", "super_admin"])
    ),
):
    return service.convert_order_to_sale(db, order_id, current_user)


@router.post("/orders/expire-check")
def expire_orders(db: Session = Depends(get_db)):

    now = datetime.now(LAGOS_TZ)

    expired_orders = db.query(Order).filter(
        Order.status == "pending",
        Order.payment_status == "unpaid",
        Order.expires_at <= now,
        Order.is_expired == False
    ).all()

    for order in expired_orders:

        # restore stock
        for item in order.items:
            revert_stock(
                db=db,
                product_id=item.product_id,
                quantity=item.quantity,
                current_user=None,
                source="order"
            )

        order.status = "cancelled"
        order.is_expired = True

    db.commit()

    return {
        "message": f"{len(expired_orders)} orders expired"
    }





# -----------------------------
# DELETE ORDER
# -----------------------------
@router.delete("/{order_id}")
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: UserDisplaySchema = Depends(
        role_required(["admin", "super_admin"])
    ),
):
    return service.delete_order(db, order_id, current_user)