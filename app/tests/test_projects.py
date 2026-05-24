from httpx import AsyncClient


class TestProjectCRUD:
    async def test_create_project(self, auth_client: AsyncClient, org: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects",
            json={"name": "New Project"},
        )
        assert r.status_code == 201
        assert r.json()["name"] == "New Project"

    async def test_create_project_with_description(self, auth_client: AsyncClient, org: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects",
            json={"name": "New Project", "description": "Some desc"},
        )
        assert r.status_code == 201
        assert r.json()["description"] == "Some desc"

    async def test_get_projects(self, auth_client: AsyncClient, org: dict, project: dict):
        r = await auth_client.get(f"/api/orgs/{org['id']}/projects")
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()]
        assert project["id"] in ids

    async def test_get_project(self, auth_client: AsyncClient, org: dict, project: dict):
        r = await auth_client.get(f"/api/orgs/{org['id']}/projects/{project['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == project["id"]

    async def test_update_project(self, auth_client: AsyncClient, org: dict, project: dict):
        r = await auth_client.patch(
            f"/api/orgs/{org['id']}/projects/{project['id']}",
            json={"name": "Updated"},
        )
        assert r.status_code == 200
        assert r.json()["name"] == "Updated"

    async def test_archive_project(self, auth_client: AsyncClient, org: dict, project: dict):
        r = await auth_client.delete(f"/api/orgs/{org['id']}/projects/{project['id']}")
        assert r.status_code == 204

    async def test_project_not_found(self, auth_client: AsyncClient, org: dict):
        r = await auth_client.get(f"/api/orgs/{org['id']}/projects/00000000-0000-0000-0000-000000000000")
        assert r.status_code == 404


class TestProjectRBAC:
    async def test_manager_cannot_create_project(self, org: dict, make_member):
        manager = await make_member("mgr@test.com", role="manager")
        r = await manager.post(f"/api/orgs/{org['id']}/projects", json={"name": "Proj"})
        assert r.status_code == 403

    async def test_employee_cannot_create_project(self, org: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")
        r = await employee.post(f"/api/orgs/{org['id']}/projects", json={"name": "Proj"})
        assert r.status_code == 403

    async def test_admin_can_create_project(self, org: dict, make_member):
        admin = await make_member("admin@test.com", role="admin")
        r = await admin.post(f"/api/orgs/{org['id']}/projects", json={"name": "Admin Proj"})
        assert r.status_code == 201

    async def test_admin_can_see_all_projects(self, auth_client: AsyncClient, org: dict, project: dict, make_member):
        admin = await make_member("admin@test.com", role="admin")
        r = await admin.get(f"/api/orgs/{org['id']}/projects")
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()]
        assert project["id"] in ids

    async def test_employee_cannot_see_project_without_membership(self, auth_client: AsyncClient, org: dict, project: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")
        r = await employee.get(f"/api/orgs/{org['id']}/projects/{project['id']}")
        assert r.status_code == 403


class TestProjectMembers:
    async def test_get_project_members(self, auth_client: AsyncClient, org: dict, project: dict):
        r = await auth_client.get(f"/api/orgs/{org['id']}/projects/{project['id']}/members")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    async def test_add_member_to_project(self, auth_client: AsyncClient, org: dict, project: dict, make_member):
        member = await make_member("emp@test.com", role="employee")
        members = (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
        emp = next(m for m in members if m["user"]["email"] == "emp@test.com")

        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/members",
            params={"user_id": emp["user"]["id"]},
        )
        assert r.status_code == 201

    async def test_add_non_org_member(self, auth_client: AsyncClient, org: dict, project: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/members",
            params={"user_id": "00000000-0000-0000-0000-000000000001"},
        )
        assert r.status_code == 400

    async def test_add_member_twice(self, auth_client: AsyncClient, org: dict, project: dict, make_member, registered_user: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/members",
            params={"user_id": registered_user["id"]},
        )
        assert r.status_code == 409

    async def test_remove_member_from_project(self, auth_client: AsyncClient, org: dict, project: dict, make_member):
        member = await make_member("emp@test.com", role="employee")
        members = (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
        emp = next(m for m in members if m["user"]["email"] == "emp@test.com")

        await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/members",
            params={"user_id": emp["user"]["id"]},
        )

        r = await auth_client.delete(
            f"/api/orgs/{org['id']}/projects/{project['id']}/members/{emp['user']['id']}"
        )
        assert r.status_code == 204
