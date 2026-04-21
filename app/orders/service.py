import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException


from app.orders.models import Order
#from app.stock.inventory.service import revert_sale_stock

from datetime import datetime




from app.orders.models import Order, OrderItem
from app.stock.products.models import Product
from app.stock.inventory.service import (
    get_inventory_orm_by_product,
    release_stock
)

from app.stock.inventory.service import (
    get_inventory_orm_by_product,
    confirm_stock
)


from app.stock.inventory.service import revert_stock

from app.sales.service import create_sale_full
from app.sales.schemas import SaleFullCreate, SaleItemData



from app.business.models import Business


import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.orders.models import Order, OrderItem
from app.stock.products.models import Product
from app.stock.inventory.service import (
    get_inventory_orm_by_product,
    remove_stock
)

from app.stock.inventory.service import (
    get_inventory_orm_by_product,
    reserve_stock
)


from app.business.models import Business


from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

LAGOS_TZ = ZoneInfo("Africa/Lagos")



def create_order(db: Session, data, slug: str):

    # -----------------------------
    # 1. Resolve business (TENANT)
    # -----------------------------
    business = db.query(Business).filter(
        Business.slug == slug
    ).first()

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found"
        )

    business_id = business.id

    # -----------------------------
    # 2. Generate order reference
    # -----------------------------
    reference = str(uuid.uuid4())[:8].upper()

    try:
        # -----------------------------
        # 3. CREATE ORDER
        # -----------------------------
        order = Order(
            business_id=business_id,
            reference=reference,
            customer_name=data.customer_name,
            customer_phone=data.customer_phone,
            customer_address=data.customer_address,
            status="pending",
            payment_status="unpaid",
            expires_at=datetime.now(LAGOS_TZ) + timedelta(minutes=30),  # test mode
            is_expired=False,
            is_converted=False
        )

        db.add(order)
        db.flush()

        total_amount = 0

        # -----------------------------
        # 4. PROCESS ITEMS
        # -----------------------------
        for item in data.items:

            product = db.query(Product).filter(
                Product.id == item.product_id,
                Product.business_id == business_id,
                Product.is_active.is_(True)
            ).first()

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item.product_id} not found"
                )

            inventory = get_inventory_orm_by_product(
                db,
                product.id,
                current_user=None
            )

            if not inventory:
                raise HTTPException(
                    status_code=400,
                    detail=f"No inventory record for {product.name}"
                )

            # ✅ IMPORTANT: check AVAILABLE (after reservation)
            available = (
                (inventory.quantity_in or 0)
                - (inventory.quantity_out or 0)
                - (inventory.reserved_stock or 0)
                + (inventory.adjustment_total or 0)
            )

            if available < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name}"
                )

            # -----------------------------
            # 💰 Calculate price
            # -----------------------------
            price = product.selling_price or 0
            line_total = price * item.quantity
            total_amount += line_total

            # -----------------------------
            # 🧾 Create order item
            # -----------------------------
            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=item.quantity,
                    price=price,
                    total=line_total
                )
            )

            # -----------------------------
            # 🔒 RESERVE STOCK (NOT REMOVE)
            # -----------------------------
            reserve_stock(
                db=db,
                product_id=product.id,
                quantity=item.quantity,
                current_user=None
            )

        # -----------------------------
        # 5. FINALIZE ORDER
        # -----------------------------
        order.total_amount = total_amount

        db.commit()
        db.refresh(order)

        return order

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Order creation failed: {str(e)}"
        )




# -----------------------------
# LIST ORDERS
# -----------------------------
def list_orders(db: Session, current_user, status=None):

    query = db.query(Order)

    # 🔐 Tenant isolation
    if "super_admin" not in current_user.roles:
        query = query.filter(
            Order.business_id == current_user.business_id
        )

    if status:
        query = query.filter(Order.status == status)

    return query.order_by(Order.created_at.desc()).all()


# -----------------------------
# GET SINGLE ORDER
# -----------------------------
def get_order(db: Session, order_id: int, current_user):

    query = db.query(Order).filter(Order.id == order_id)

    if "super_admin" not in current_user.roles:
        query = query.filter(
            Order.business_id == current_user.business_id
        )

    return query.first()


# -----------------------------
# UPDATE STATUS
# -----------------------------
def update_order_status(db: Session, order_id: int, status: str, current_user):

    order = get_order(db, order_id, current_user)

    if not order:
        raise HTTPException(404, "Order not found")

    order.status = status

    db.commit()
    db.refresh(order)

    return {
        "message": "Order updated successfully",
        "status": order.status
    }



def update_order(db: Session, order_id: int, data, current_user):

    try:
        order = get_order(db, order_id, current_user)

        if not order:
            raise HTTPException(404, "Order not found")

        business_id = order.business_id

        # -----------------------------
        # 1. UPDATE CUSTOMER INFO
        # -----------------------------
        if data.customer_name is not None:
            order.customer_name = data.customer_name

        if data.customer_phone is not None:
            order.customer_phone = data.customer_phone

        if data.customer_address is not None:
            order.customer_address = data.customer_address

        # -----------------------------
        # 2. UPDATE ITEMS
        # -----------------------------
        if data.items is not None:

            # STEP A: RELEASE OLD RESERVATIONS
            for item in order.items:
                release_stock(
                    db=db,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    current_user=current_user
                )

            # STEP B: DELETE OLD ITEMS
            for item in order.items:
                db.delete(item)

            db.flush()

            total_amount = 0

            # STEP C: ADD NEW ITEMS
            for item in data.items:

                product = db.query(Product).filter(
                    Product.id == item.product_id,
                    Product.business_id == business_id,
                    Product.is_active.is_(True)
                ).first()

                if not product:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Product {item.product_id} not found"
                    )

                inventory = get_inventory_orm_by_product(
                    db,
                    product.id,
                    current_user=current_user
                )

                # ✅ CHECK AVAILABLE STOCK (NOT current_stock)
                available = (
                    (inventory.quantity_in or 0)
                    - (inventory.quantity_out or 0)
                    - (inventory.reserved_stock or 0)
                    + (inventory.adjustment_total or 0)
                )

                if available < item.quantity:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient stock for {product.name}"
                    )

                price = product.selling_price or 0
                line_total = price * item.quantity
                total_amount += line_total

                db.add(
                    OrderItem(
                        order_id=order.id,
                        product_id=product.id,
                        quantity=item.quantity,
                        price=price,
                        total=line_total
                    )
                )

                # STEP D: RESERVE NEW STOCK
                reserve_stock(
                    db=db,
                    product_id=product.id,
                    quantity=item.quantity,
                    current_user=current_user
                )

            order.total_amount = total_amount

        db.commit()
        db.refresh(order)

        return {
            "message": "Order updated successfully",
            "data": {
                "id": order.id,
                "reference": order.reference,
                "total_amount": order.total_amount,
                "status": order.status
            }
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Order update failed: {str(e)}"
        )



from app.sales.models import Sale, SaleItem


from datetime import datetime, date

def convert_order_to_sale(db: Session, order_id: int, current_user):

    try:
        order = get_order(db, order_id, current_user)

        if not order:
            raise HTTPException(404, "Order not found")

        if order.is_converted:
            raise HTTPException(400, "Order already converted")

        # -----------------------------
        # BUILD SALE ITEMS
        # -----------------------------
        sale_items = [
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "selling_price": item.price,
                "discount": 0
            }
            for item in order.items
        ]

        # -----------------------------
        # CREATE SALE DATA
        # -----------------------------
        sale_data = SaleFullCreate(
            invoice_date=date.today(),
            customer_name=order.customer_name,
            customer_phone=order.customer_phone,
            ref_no=f"ORDER-{order.id}",
            items=sale_items
        )

        # -----------------------------
        # CREATE SALE (handles stock deduction)
        # -----------------------------
        created_sale = create_sale_full(
            db=db,
            sale_data=sale_data,
            current_user=current_user,
            business_id=order.business_id,
        )

        # ✅ ADD THIS HERE (IMPORTANT)
        order.sale_id = created_sale.id

        # -----------------------------
        # ONLY MARK ORDER CLOSED
        # -----------------------------
        order.sale_id = created_sale.id   # ✅ THIS is correct
        order.is_converted = True
        order.status = "completed"
        order.payment_status = "unpaid"

        db.commit()
        db.refresh(order)

        return {
            "message": "Order converted successfully",
            "sale_id": created_sale.id,
            "invoice_no": created_sale.invoice_no
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Conversion failed: {str(e)}")




def delete_order(db: Session, order_id: int, current_user):

    try:
        order = get_order(db, order_id, current_user)

        if not order:
            raise HTTPException(404, "Order not found")

        # -----------------------------
        # 🔥 RELEASE RESERVED STOCK
        # -----------------------------
        for item in order.items:

            release_stock(
                db=db,
                product_id=item.product_id,
                quantity=item.quantity,
                current_user=current_user
            )

        # -----------------------------
        # DELETE ORDER
        # -----------------------------
        db.delete(order)
        db.commit()

        return {"message": "Order deleted successfully"}

    except:
        db.rollback()
        raise
