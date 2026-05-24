# embedded packages
from enum import Enum


# перечисление для ролей в организации
class OrgRole(str, Enum):
    owner = "owner"
    admin = "admin"
    manager = "manager"
    employee = "employee"


# иерархия ролей
ROLE_HIERARCHY = {
    OrgRole.owner: 4,
    OrgRole.admin: 3,
    OrgRole.manager: 2,
    OrgRole.employee: 1,
}


# перечисление для запросов на выход из организации
class LeaveRequestStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
