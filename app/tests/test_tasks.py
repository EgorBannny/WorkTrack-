from httpx import AsyncClient


class TestTaskCRUD:
    async def test_create_task(self, auth_client: AsyncClient, org: dict, project: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            json={"title": "My Task", "priority": "high"},
        )
        assert r.status_code == 201
        data = r.json()
        assert data["title"] == "My Task"
        assert data["priority"] == "high"
        assert data["status"] == "backlog"

    async def test_get_tasks(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.get(f"/api/orgs/{org['id']}/projects/{project['id']}/tasks")
        assert r.status_code == 200
        ids = [t["id"] for t in r.json()]
        assert task["id"] in ids

    async def test_get_task(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.get(f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == task["id"]

    async def test_update_task(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.patch(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}",
            json={"title": "Updated", "status": "in_progress"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "Updated"
        assert data["status"] == "in_progress"

    async def test_update_task_position(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.patch(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/position",
            json={"position": 99},
        )
        assert r.status_code == 200
        assert r.json()["position"] == 99

    async def test_delete_task(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.delete(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}"
        )
        assert r.status_code == 204

    async def test_task_not_found(self, auth_client: AsyncClient, org: dict, project: dict):
        r = await auth_client.get(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/00000000-0000-0000-0000-000000000000"
        )
        assert r.status_code == 404


class TestTaskAssignee:
    async def test_assign_project_member(self, auth_client: AsyncClient, org: dict, project: dict, registered_user: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            json={"title": "Assigned", "priority": "low", "assignee_id": registered_user["id"]},
        )
        assert r.status_code == 201
        assert r.json()["assignee"]["id"] == registered_user["id"]

    async def test_assign_non_project_member(self, auth_client: AsyncClient, org: dict, project: dict, make_member):
        member = await make_member("emp@test.com", role="employee")
        org_members = (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
        emp = next(m for m in org_members if m["user"]["email"] == "emp@test.com")

        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            json={"title": "Bad Task", "priority": "low", "assignee_id": emp["user"]["id"]},
        )
        assert r.status_code == 400


class TestTaskFilters:
    async def test_filter_by_status(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        await auth_client.patch(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}",
            json={"status": "in_progress"},
        )
        r = await auth_client.get(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            params={"status_filter": "in_progress"},
        )
        assert r.status_code == 200
        assert all(t["status"] == "in_progress" for t in r.json())

    async def test_filter_by_priority(self, auth_client: AsyncClient, org: dict, project: dict):
        await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            json={"title": "High Prio", "priority": "critical"},
        )
        r = await auth_client.get(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            params={"priority": "critical"},
        )
        assert r.status_code == 200
        assert all(t["priority"] == "critical" for t in r.json())

    async def test_filter_by_search(self, auth_client: AsyncClient, org: dict, project: dict):
        await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            json={"title": "Unique XYZ title", "priority": "low"},
        )
        r = await auth_client.get(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            params={"search": "Unique XYZ"},
        )
        assert r.status_code == 200
        assert len(r.json()) == 1
        assert "Unique XYZ" in r.json()[0]["title"]

    async def test_empty_filter_returns_all(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.get(f"/api/orgs/{org['id']}/projects/{project['id']}/tasks")
        assert r.status_code == 200
        assert len(r.json()) >= 1


class TestTaskHistory:
    async def test_history_recorded_on_update(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        await auth_client.patch(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}",
            json={"status": "in_progress"},
        )
        r = await auth_client.get(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/history"
        )
        assert r.status_code == 200
        fields = [h["field_changed"] for h in r.json()]
        assert "status" in fields

    async def test_history_empty_initially(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.get(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/history"
        )
        assert r.status_code == 200
        assert r.json() == []


class TestTaskRBAC:
    async def test_employee_cannot_create_task(self, org: dict, project: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")
        r = await employee.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            json={"title": "Task", "priority": "low"},
        )
        assert r.status_code == 403

    async def test_employee_cannot_delete_task(self, auth_client: AsyncClient, org: dict, project: dict, task: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")

        await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/members",
            params={"user_id": (
                next(
                    m["user"]["id"]
                    for m in (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
                    if m["user"]["email"] == "emp@test.com"
                )
            )},
        )

        r = await employee.delete(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}"
        )
        assert r.status_code == 403
