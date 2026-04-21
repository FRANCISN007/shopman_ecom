from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from zoneinfo import ZoneInfo
from app.database import Base

LAGOS_TZ = ZoneInfo("Africa/Lagos")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    # 🔑 Multi-tenant ownership
    business_id = Column(
        Integer,
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    # 🔹 Internal identifiers
    sku = Column(String, nullable=True, index=True)
    barcode = Column(String, nullable=True, index=True)

    type = Column(String, nullable=True)

    cost_price = Column(Float, nullable=True)
    selling_price = Column(Float, nullable=True)

    # ----------------- E-COMMERCE ADDITIONS -----------------

    # 📝 Product description for storefront
    description = Column(String, nullable=True)

    # 🖼 Product main image
    image_url = Column(String, nullable=True)

    # 🌐 Controls if product is visible online
    is_published = Column(Boolean, default=False, nullable=False, index=True)

    # 🔗 URL-friendly identifier (optional but useful)
    slug = Column(String, nullable=True, index=True)

    # ----------------- EXISTING FLAGS -----------------

    is_active = Column(Boolean, default=True, nullable=False, index=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(LAGOS_TZ)
    )

    # ----------------- RELATIONSHIPS -----------------

    business = relationship("Business", back_populates="products")
    category = relationship("Category", back_populates="products")

    # ----------------- TABLE CONFIG -----------------

    __table_args__ = (

        # ----------------- UNIQUE CONSTRAINTS -----------------

        UniqueConstraint(
            "name",
            "category_id",
            "business_id",
            name="uq_product_name_category_business"
        ),

        UniqueConstraint(
            "sku",
            "business_id",
            name="uq_product_sku_business"
        ),

        UniqueConstraint(
            "barcode",
            "business_id",
            name="uq_product_barcode_business"
        ),

        # ⚠️ Optional: enforce unique slug per business
        # Uncomment when you start using slug actively
        # UniqueConstraint(
        #     "slug",
        #     "business_id",
        #     name="uq_product_slug_business"
        # ),

        # ----------------- INDEXES -----------------

        Index("idx_product_business_active", "business_id", "is_active"),

        Index("idx_product_business_category", "business_id", "category_id"),

        Index("idx_product_business_name", "business_id", "name"),

        Index("idx_product_barcode_business", "barcode", "business_id"),

        # 🚀 New index for storefront queries
        Index("idx_product_public_listing", "business_id", "is_published", "is_active"),

    )
