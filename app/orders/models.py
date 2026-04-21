from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Index, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from app.database import Base


LAGOS_TZ = ZoneInfo("Africa/Lagos")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    # 🔑 Multi-tenant link
    business_id = Column(
        Integer,
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # 🧾 Order reference (NOT globally unique anymore)
    reference = Column(String(50), nullable=False, index=True)

    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="SET NULL"), nullable=True)



    # 👤 Customer info
    customer_name = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    customer_address = Column(String, nullable=True)

    is_converted = Column(Boolean, default=False)


    

    expires_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    is_expired = Column(Boolean, default=False, server_default="false")



    # 💰 Financials
    total_amount = Column(Float, default=0)
    paid_amount = Column(Float, default=0)

    # 📦 Order lifecycle
    status = Column(String, default="pending", index=True)
    # pending | paid | processing | shipped | completed | cancelled

    payment_status = Column(String, default="unpaid", index=True)
    # unpaid | paid | failed | refunded

    payment_reference = Column(String, nullable=True)

    # 📅 timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(LAGOS_TZ),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(LAGOS_TZ),
        onupdate=lambda: datetime.now(LAGOS_TZ)
    )

    # ================= RELATIONSHIPS =================
    business = relationship("Business")
    
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    sale = relationship(
        "Sale",
        backref="order",
        foreign_keys=[sale_id]   # 🔥 THIS FIXES THE ERROR
    )


    # ----------------- INDEXES (Aligned with Purchase) -----------------
    __table_args__ = (
        Index("idx_orders_business_reference", "business_id", "reference"),
        Index("idx_orders_business_created", "business_id", "created_at"),
        Index("idx_orders_business_status", "business_id", "status"),
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(LAGOS_TZ)
    )

    quantity = Column(Integer, nullable=False)

    price = Column(Float, nullable=False)  # snapshot

    total = Column(Float, nullable=False)

    # ================= RELATIONSHIPS =================
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

    # ----------------- INDEXES -----------------
    __table_args__ = (
        Index("idx_order_item_order_product", "order_id", "product_id"),
        Index("idx_order_item_created", "order_id", "created_at"),
    )
