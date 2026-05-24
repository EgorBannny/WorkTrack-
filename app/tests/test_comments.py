from httpx import AsyncClient


class TestCommentCRUD:
    async def test_create_comment(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments",
            json={"content": "Hello!"},
        )
        assert r.status_code == 201
        data = r.json()
        assert data["content"] == "Hello!"
        assert data["author"] is not None

    async def test_get_comments(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments",
            json={"content": "First"},
        )
        await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments",
            json={"content": "Second"},
        )
        r = await auth_client.get(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments"
        )
        assert r.status_code == 200
        assert len(r.json()) == 2
        assert r.json()[0]["content"] == "First"
        assert r.json()[1]["content"] == "Second"

    async def test_update_own_comment(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments",
            json={"content": "Original"},
        )
        comment_id = r.json()["id"]

        r = await auth_client.patch(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments/{comment_id}",
            json={"content": "Edited"},
        )
        assert r.status_code == 200
        assert r.json()["content"] == "Edited"

    async def test_delete_own_comment(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments",
            json={"content": "To delete"},
        )
        comment_id = r.json()["id"]

        r = await auth_client.delete(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments/{comment_id}"
        )
        assert r.status_code == 204


class TestCommentRBAC:
    async def _add_emp_to_project(self, auth_client, org, project, emp_email):
        members = (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
        emp = next(m for m in members if m["user"]["email"] == emp_email)
        await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/members",
            params={"user_id": emp["user"]["id"]},
        )

    async def test_employee_cannot_edit_others_comment(
        self, auth_client: AsyncClient, org: dict, project: dict, task: dict, make_member
    ):
        employee = await make_member("emp@test.com", role="employee")
        await self._add_emp_to_project(auth_client, org, project, "emp@test.com")

        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments",
            json={"content": "Owner comment"},
        )
        comment_id = r.json()["id"]

        r = await employee.patch(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments/{comment_id}",
            json={"content": "Hacked"},
        )
        assert r.status_code == 403

    async def test_manager_can_delete_others_comment(
        self, auth_client: AsyncClient, org: dict, project: dict, task: dict, make_member
    ):
        manager = await make_member("mgr@test.com", role="manager")

        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments",
            json={"content": "Owner comment"},
        )
        comment_id = r.json()["id"]

        r = await manager.delete(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments/{comment_id}"
        )
        assert r.status_code == 204

    async def test_employee_can_delete_own_comment(
        self, auth_client: AsyncClient, org: dict, project: dict, task: dict, make_member
    ):
        employee = await make_member("emp@test.com", role="employee")
        await self._add_emp_to_project(auth_client, org, project, "emp@test.com")

        r = await employee.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments",
            json={"content": "My comment"},
        )
        comment_id = r.json()["id"]

        r = await employee.delete(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments/{comment_id}"
        )
        assert r.status_code == 204

    async def test_employee_cannot_delete_others_comment(
        self, auth_client: AsyncClient, org: dict, project: dict, task: dict, make_member
    ):
        employee = await make_member("emp@test.com", role="employee")
        await self._add_emp_to_project(auth_client, org, project, "emp@test.com")

        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments",
            json={"content": "Owner comment"},
        )
        comment_id = r.json()["id"]

        r = await employee.delete(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/comments/{comment_id}"
        )
        assert r.status_code == 403
