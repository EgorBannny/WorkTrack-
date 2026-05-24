"""
Security tests: broken access control, auth bypass, RBAC violations, input validation.
"""

import pytest
from httpx import AsyncClient, ASGITransport

from app.app import main_app

from .test_attachments import FAKE_PHP, FAKE_EXE


class TestBrokenAccessControl:
    """Users should not be able to access resources of other organizations."""

    @pytest.fixture
    async def second_org(self, client: AsyncClient):  # noqa: ARG002
        """Creates a second user with their own org using a separate client."""
        async with AsyncClient(transport=ASGITransport(app=main_app), base_url="http://test") as ac:
            await ac.post(
                "/api/auth/cookie/register",
                json={
                    "email": "second@test.com",
                    "password": "Test1234!",
                    "display_name": "Second",
                },
            )
            await ac.post(
                "/api/auth/cookie/login",
                data={"username": "second@test.com", "password": "Test1234!"},
            )
            r = await ac.post("/api/orgs", json={"name": "Second Org"})
            assert r.status_code == 201
            yield r.json(), ac

    async def test_cannot_access_another_org(
        self, auth_client: AsyncClient, second_org
    ):
        other_org, _ = second_org
        r = await auth_client.get(f"/api/orgs/{other_org['id']}")
        assert r.status_code == 404

    async def test_cannot_access_another_orgs_projects(
        self, auth_client: AsyncClient, second_org
    ):
        other_org, _ = second_org
        r = await auth_client.get(f"/api/orgs/{other_org['id']}/projects")
        assert r.status_code == 404

    async def test_cannot_access_another_orgs_members(
        self, auth_client: AsyncClient, second_org
    ):
        other_org, _ = second_org
        r = await auth_client.get(f"/api/orgs/{other_org['id']}/members")
        assert r.status_code == 404

    async def test_cannot_create_project_in_another_org(
        self, auth_client: AsyncClient, second_org
    ):
        other_org, _ = second_org
        r = await auth_client.post(
            f"/api/orgs/{other_org['id']}/projects",
            json={"name": "Hijacked"},
        )
        assert r.status_code == 404

    async def test_cannot_access_project_from_another_org(
        self, auth_client: AsyncClient, org: dict, project: dict, second_org
    ):
        other_org, second_client = second_org
        r = await second_client.get(
            f"/api/orgs/{other_org['id']}/projects/{project['id']}"
        )
        assert r.status_code == 404

    async def test_cannot_access_tasks_from_another_org(
        self, auth_client: AsyncClient, org: dict, project: dict, task: dict, second_org
    ):
        other_org, second_client = second_org
        r = await second_client.get(
            f"/api/orgs/{other_org['id']}/projects/{project['id']}/tasks/{task['id']}"
        )
        assert r.status_code == 404


class TestAuthBypass:
    async def test_unauthenticated_cannot_access_orgs(self, client: AsyncClient):
        r = await client.get("/api/orgs/me")
        assert r.status_code == 401

    async def test_unauthenticated_cannot_access_users_me(self, client: AsyncClient):
        r = await client.get("/api/users/me")
        assert r.status_code == 401

    async def test_token_invalidated_after_logout(self, auth_client: AsyncClient):
        token = auth_client.cookies.get("access_token")
        await auth_client.post("/api/auth/cookie/logout")
        auth_client.cookies.set("access_token", token)
        r = await auth_client.get("/api/users/me")
        assert r.status_code == 401

    async def test_deactivated_user_cannot_access(self, auth_client: AsyncClient):
        await auth_client.delete("/api/users/me")
        r = await auth_client.get("/api/users/me")
        assert r.status_code == 401

    async def test_invalid_token_rejected(self, client: AsyncClient):
        r = await client.get(
            "/api/users/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert r.status_code == 401


class TestFileUploadSecurity:
    async def test_php_content_rejected(
        self, auth_client: AsyncClient, org: dict, project: dict, task: dict
    ):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[("file", ("malware.php", FAKE_PHP, "application/x-php"))],
        )
        assert r.status_code == 400

    async def test_exe_renamed_as_image_rejected(
        self, auth_client: AsyncClient, org: dict, project: dict, task: dict
    ):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[("file", ("legit.jpg", FAKE_EXE, "image/jpeg"))],
        )
        assert r.status_code == 400

    async def test_oversized_file_rejected(
        self, auth_client: AsyncClient, org: dict, project: dict, task: dict
    ):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[("file", ("big.jpg", b"\x00" * (21 * 1024 * 1024), "image/jpeg"))],
        )
        assert r.status_code == 400


class TestRBACViolations:
    async def test_employee_cannot_invite(self, org: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")
        r = await employee.post(
            f"/api/orgs/{org['id']}/invite",
            json={"email": "new@test.com", "role": "employee", "position": "Dev"},
        )
        assert r.status_code == 403

    async def test_manager_cannot_create_project(self, org: dict, make_member):
        manager = await make_member("mgr@test.com", role="manager")
        r = await manager.post(f"/api/orgs/{org['id']}/projects", json={"name": "Proj"})
        assert r.status_code == 403

    async def test_employee_cannot_create_task(
        self, org: dict, project: dict, make_member
    ):
        employee = await make_member("emp@test.com", role="employee")
        r = await employee.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            json={"title": "Task", "priority": "low"},
        )
        assert r.status_code == 403

    async def test_manager_cannot_change_admin_role(
        self, auth_client: AsyncClient, org: dict, make_member
    ):
        admin = await make_member("admin@test.com", role="admin")
        manager = await make_member("mgr@test.com", role="manager")

        org_members = (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
        admin_member = next(
            m for m in org_members if m["user"]["email"] == "admin@test.com"
        )

        r = await manager.patch(
            f"/api/orgs/{org['id']}/members/{admin_member['user']['id']}",
            json={"role": "employee"},
        )
        assert r.status_code == 403

    async def test_manager_cannot_approve_admin_leave(
        self, auth_client: AsyncClient, org: dict, make_member
    ):
        admin = await make_member("admin@test.com", role="admin")
        manager = await make_member("mgr@test.com", role="manager")

        r = await admin.post(f"/api/orgs/{org['id']}/leave-request")
        request_id = r.json()["id"]

        r = await manager.post(
            f"/api/orgs/{org['id']}/leave-requests/{request_id}/approve"
        )
        assert r.status_code == 403

    async def test_employee_cannot_archive_org(self, org: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")
        r = await employee.delete(f"/api/orgs/{org['id']}")
        assert r.status_code == 403


class TestInputValidation:
    async def test_empty_org_name(self, auth_client: AsyncClient):
        r = await auth_client.post("/api/orgs", json={"name": ""})
        assert r.status_code == 422

    async def test_org_name_too_long(self, auth_client: AsyncClient):
        r = await auth_client.post("/api/orgs", json={"name": "x" * 300})
        assert r.status_code == 422

    async def test_empty_task_title(
        self, auth_client: AsyncClient, org: dict, project: dict
    ):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            json={"title": "", "priority": "low"},
        )
        assert r.status_code == 422

    async def test_invalid_task_priority(
        self, auth_client: AsyncClient, org: dict, project: dict
    ):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            json={"title": "Task", "priority": "ultra_mega_high"},
        )
        assert r.status_code == 422

    async def test_sql_injection_in_search(
        self, auth_client: AsyncClient, org: dict, project: dict
    ):
        r = await auth_client.get(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks",
            params={"search": "'; DROP TABLE tasks; --"},
        )
        assert r.status_code == 200

    async def test_invalid_uuid_in_path(self, auth_client: AsyncClient, org: dict):
        r = await auth_client.get(f"/api/orgs/{org['id']}/projects/not-a-uuid")
        assert r.status_code == 422
