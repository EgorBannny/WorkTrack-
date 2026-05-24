import pytest
from httpx import AsyncClient


@pytest.fixture
async def org_with_tasks(auth_client: AsyncClient, org: dict, project: dict):
    """Org with a few tasks in different statuses and priorities."""
    statuses = ["backlog", "in_progress", "done"]
    priorities = ["low", "medium", "high"]

    for i, (s, p) in enumerate(zip(statuses, priorities)):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            json={"title": f"Task {i}", "priority": p},
        )
        task_id = r.json()["id"]
        if s != "backlog":
            await auth_client.patch(
                f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task_id}",
                json={"status": s},
            )

    return org


class TestAnalyticsAccess:
    async def test_overview_accessible_to_manager(self, org: dict, make_member):
        manager = await make_member("mgr@test.com", role="manager")
        r = await manager.get(f"/api/orgs/{org['id']}/analytics/overview")
        assert r.status_code == 200

    async def test_employee_cannot_access_overview(self, org: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")
        r = await employee.get(f"/api/orgs/{org['id']}/analytics/overview")
        assert r.status_code == 403

    async def test_employee_cannot_access_members(self, org: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")
        r = await employee.get(f"/api/orgs/{org['id']}/analytics/members")
        assert r.status_code == 403

    async def test_employee_cannot_access_timeline(self, org: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")
        r = await employee.get(f"/api/orgs/{org['id']}/analytics/timeline")
        assert r.status_code == 403

    async def test_employee_cannot_access_priorities(self, org: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")
        r = await employee.get(f"/api/orgs/{org['id']}/analytics/priorities")
        assert r.status_code == 403


class TestAnalyticsData:
    async def test_overview_structure(self, auth_client: AsyncClient, org_with_tasks: dict):
        r = await auth_client.get(f"/api/orgs/{org_with_tasks['id']}/analytics/overview")
        assert r.status_code == 200
        data = r.json()
        assert "total" in data
        assert "backlog" in data
        assert "in_progress" in data
        assert "done" in data
        assert data["total"] == 3

    async def test_overview_counts(self, auth_client: AsyncClient, org_with_tasks: dict):
        r = await auth_client.get(f"/api/orgs/{org_with_tasks['id']}/analytics/overview")
        data = r.json()
        assert data["backlog"] == 1
        assert data["in_progress"] == 1
        assert data["done"] == 1

    async def test_members_workload_structure(self, auth_client: AsyncClient, org_with_tasks: dict):
        r = await auth_client.get(f"/api/orgs/{org_with_tasks['id']}/analytics/members")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    async def test_timeline_structure(self, auth_client: AsyncClient, org_with_tasks: dict):
        r = await auth_client.get(f"/api/orgs/{org_with_tasks['id']}/analytics/timeline")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        if data:
            assert "date" in data[0]
            assert "count" in data[0]

    async def test_priorities_structure(self, auth_client: AsyncClient, org_with_tasks: dict):
        r = await auth_client.get(f"/api/orgs/{org_with_tasks['id']}/analytics/priorities")
        assert r.status_code == 200
        data = r.json()
        assert "low" in data
        assert "medium" in data
        assert "high" in data
        assert "critical" in data

    async def test_priorities_counts(self, auth_client: AsyncClient, org_with_tasks: dict):
        r = await auth_client.get(f"/api/orgs/{org_with_tasks['id']}/analytics/priorities")
        data = r.json()
        assert data["low"] == 1
        assert data["medium"] == 1
        assert data["high"] == 1
        assert data["critical"] == 0

    async def test_overview_empty_org(self, auth_client: AsyncClient, org: dict):
        r = await auth_client.get(f"/api/orgs/{org['id']}/analytics/overview")
        assert r.status_code == 200
        assert r.json()["total"] == 0
