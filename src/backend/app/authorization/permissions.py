ROLE_PERMISSIONS = {
    "citizen": ["view_own"],
    "ngo": ["view_all", "verify"],
    "authority": ["view_all", "verify", "reject"],
    "admin": ["*"]
}

def has_permission(role: str, permission: str):
    if role == "admin":
        return True
    return permission in ROLE_PERMISSIONS.get(role, [])
