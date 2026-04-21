from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderCreate(BaseModel):
    slug: str   # 👈 NEW (tenant identifier)

    customer_name: Optional[str]
    customer_phone: Optional[str]
    customer_address: Optional[str]

    items: List[OrderItemCreate]


# -----------------------------
# ORDER ITEM (OUTPUT)
# -----------------------------
class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int]
    quantity: int
    price: float
    total: float

    class Config:
        from_attributes = True


# -----------------------------
# ORDER OUTPUT (MAIN)
# -----------------------------
class OrderOut(BaseModel):
    id: int
    reference: str
    customer_name: Optional[str]
    customer_phone: Optional[str]
    customer_address: Optional[str]

    total_amount: float
    paid_amount: float

    status: str
    payment_status: str

    created_at: datetime

    items: List[OrderItemOut]

    class Config:
        from_attributes = True


# -----------------------------
# UPDATE STATUS
# -----------------------------
class OrderStatusUpdate(BaseModel):
    status: str


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    items: Optional[List[OrderItemCreate]] = None
