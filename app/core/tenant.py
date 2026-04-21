from contextvars import ContextVar
from typing import Optional

# Holds the current tenant business_id per request
_current_business_id: ContextVar[Optional[int]] = ContextVar(
    "current_business_id",
    default=None
)


def set_current_business(business_id: Optional[int]):
    """
    Set the current tenant (business_id).
    Use None for super admin or public unauthenticated routes.
    """
    _current_business_id.set(business_id)


def get_current_business() -> Optional[int]:
    """
    Get the current tenant (business_id).
    Returns None if not set or super admin/public context.
    """
    return _current_business_id.get()


def require_current_business() -> int:
    """
    Enforce that a tenant MUST exist.
    Use this in protected operations (create/update/delete).
    """
    business_id = _current_business_id.get()

    if business_id is None:
        raise RuntimeError("No tenant context found for this request")

    return business_id


def clear_current_business():
    """
    Explicitly clear tenant (optional helper).
    Middleware already does this, but useful for safety.
    """
    _current_business_id.set(None)
