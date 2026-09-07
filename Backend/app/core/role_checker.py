from fastapi import Depends, HTTPException, status
from app.core.security import get_current_user


class RoleChecker:
    """
    Generic Role Based Access Control Dependency.

    Example:
        admin_only = RoleChecker(["admin"])

        @router.get("/users")
        def users(current_user=Depends(admin_only)):
            ...
    """

    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user=Depends(get_current_user)):

        if current_user.role not in self.allowed_roles:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {', '.join(self.allowed_roles)}"
            )

        return current_user


# ======================================================
# Ready-to-use Role Dependencies
# ======================================================

# Administrator only
admin_only = RoleChecker(
    ["admin"]
)

# Admin + Investigator
investigator_access = RoleChecker(
    [
        "admin",
        "investigator"
    ]
)

# Users allowed to upload evidence
upload_access = RoleChecker(
    [
        "admin",
        "investigator",
        "officer"
    ]
)

# Users allowed to download evidence
download_access = RoleChecker(
    [
        "admin",
        "investigator"
    ]
)

# Users allowed to verify evidence
verify_access = RoleChecker(
    [
        "admin",
        "investigator",
        "auditor"
    ]
)

# Anyone authenticated
authenticated_user = RoleChecker(
    [
        "admin",
        "investigator",
        "officer",
        "auditor"
    ]
)