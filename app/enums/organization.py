from enum import Enum


class OrgRole(str, Enum):
    owner = "owner"
    admin = "admin"
    manager = "manager"
    employee = "employee"


class LeaveRequestStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


ROLE_HIERARCHY = {
    OrgRole.owner: 4,
    OrgRole.admin: 3,
    OrgRole.manager: 2,
    OrgRole.employee: 1,
}
