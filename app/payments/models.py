from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from zoneinfo import ZoneInfo
from app.database import Base

LAGOS_TZ = ZoneInfo("Africa/Lagos")



class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    # -----------------------------
    # TENANT
    # -----------------------------
    business_id = Column(
        Integer,
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    

    # -----------------------------
    # PRIMARY LINK (NEW STANDARD)
    # -----------------------------
    sale_id = Column(
        Integer,
        ForeignKey("sales.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    

    # -----------------------------
    # PAYMENT INFO
    # -----------------------------
    amount_paid = Column(Float, nullable=False)
    discount_allowed = Column(Float, default=0.0)

    payment_method = Column(String, nullable=False)  # cash, bank, transfer

    bank_id = Column(
        Integer,
        ForeignKey("banks.id", ondelete="SET NULL"),
        nullable=True
    )

    reference_no = Column(String, nullable=True)

    balance_due = Column(Float, default=0.0)

    # -----------------------------
    # PAYMENT LIFECYCLE (IMPORTANT FIX)
    # -----------------------------
    status = Column(
        String,
        default="pending"  
        # pending | approved | rejected | reversed
    )

    is_approved = Column(Boolean, default=False)
    approved_at = Column(DateTime, nullable=True)

    # -----------------------------
    # AUDIT
    # -----------------------------
    payment_date = Column(
        DateTime,
        default=lambda: datetime.now(LAGOS_TZ),
        index=True
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(LAGOS_TZ),
        nullable=False
    )


    business = relationship(
        "Business",
        back_populates="payments"
    )


    # -----------------------------
    # RELATIONSHIPS (FIXED)
    # -----------------------------
    

    sale = relationship(
        "Sale",
        back_populates="payments"
    )

    bank = relationship("Bank")
    user = relationship("User")

    # -----------------------------
    # INDEXES
    # -----------------------------
    __table_args__ = (

        Index("idx_payment_business_sale", "business_id", "sale_id"),
        Index("idx_payment_business_status", "business_id", "status"),
        Index("idx_payment_business_date", "business_id", "payment_date"),
    )