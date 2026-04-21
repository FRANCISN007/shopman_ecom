from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Identity, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from sqlalchemy.sql import func




class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)

    business_id = Column(
        Integer,
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    business = relationship("Business", back_populates="sales")

    invoice_no = Column(Integer, Identity(start=1, increment=1), index=True)

    invoice_date = Column(DateTime, default=datetime.utcnow)

    ref_no = Column(String)

    customer_name = Column(String)
    customer_phone = Column(String)
    customer_address = Column(String)

    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="SET NULL"),
        index=True
    )

    payment_due_at = Column(DateTime)

    total_amount = Column(Float, default=0)

    sold_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    sold_at = Column(DateTime(timezone=True), server_default=func.now())

    # -----------------------------
    # RELATIONSHIPS (FIXED)
    # -----------------------------
    items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    payments = relationship(
        "Payment",
        back_populates="sale",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    user = relationship("User", backref="sales")




class SaleItem(Base):
    __tablename__ = "sale_items"

    __table_args__ = (
        Index("idx_saleitems_sale_product", "sale_id", "product_id"),
    )

    id = Column(Integer, primary_key=True, index=True)

    # ✅ Correct FK (PRIMARY FIX)
    sale_id = Column(
        Integer,
        ForeignKey("sales.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True  # ✅ add index for performance
    )

    quantity = Column(Integer, nullable=False)

    selling_price = Column(Float, nullable=False)

    cost_price = Column(Float, nullable=False, default=0)

    total_amount = Column(Float, nullable=False)

    gross_amount = Column(Float, nullable=False)

    discount = Column(Float, default=0)

    net_amount = Column(Float, nullable=False)

    # -----------------------------
    # RELATIONSHIPS (IMPROVED)
    # -----------------------------
    sale = relationship(
        "Sale",
        back_populates="items",
        foreign_keys=[sale_id]  # ✅ prevents ORM ambiguity issues
    )

    product = relationship(
        "Product",
        lazy="joined"  # ✅ avoids N+1 query when listing sales
    )




class SaleExpiryLog(Base):
    __tablename__ = "sale_expiry_logs"

    id = Column(Integer, primary_key=True, index=True)

    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), index=True)

    status = Column(String)  # "expired", "skipped_paid", "already_processed"

    created_at = Column(DateTime, default=datetime.utcnow)
