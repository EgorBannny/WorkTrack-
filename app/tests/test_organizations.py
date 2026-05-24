from httpx import AsyncClient


class TestOrganizationCRUD:
    async def test_create_org(self, auth_client: AsyncClient):
        r = await auth_client.post("/api/orgs", json={"name": "My Org"})
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == "My Org"
        assert data["role"] == "owner"

    async def test_create_org_with_description(self, auth_client: AsyncClient):
        r = await auth_client.post("/api/orgs", json={"name": "My Org", "description": "Desc"})
        assert r.status_code == 201
        assert r.json()["description"] == "Desc"

    async def test_get_my_orgs(self, auth_client: AsyncClient, org: dict):
        r = await auth_client.get("/api/orgs/me")
        assert r.status_code == 200
        ids = [o["id"] for o in r.json()]
        assert org["id"] in ids

    async def test_get_org(self, auth_client: AsyncClient, org: dict):
        r = await auth_client.get(f"/api/orgs/{org['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == org["id"]

    async def test_get_org_not_found(self, auth_client: AsyncClient):
        r = await auth_client.get("/api/orgs/00000000-0000-0000-0000-000000000000")
        assert r.status_code == 404

    async def test_update_org(self, auth_client: AsyncClient, org: dict):
        r = await auth_client.patch(f"/api/orgs/{org['id']}", json={"name": "Updated Org"})
        assert r.status_code == 200
        assert r.json()["name"] == "Updated Org"

    async def test_archive_org(self, auth_client: AsyncClient, org: dict):
        r = await auth_client.delete(f"/api/orgs/{org['id']}")
        assert r.status_code == 204

    async def test_archive_org_twice(self, auth_client: AsyncClient, org: dict):
        await auth_client.delete(f"/api/orgs/{org['id']}")
        r = await auth_client.delete(f"/api/orgs/{org['id']}")
        assert r.status_code == 404

    async def test_unauthenticated(self, client: AsyncClient):
        r = await client.get("/api/orgs/me")
        assert r.status_code == 401


class TestMembers:
    async def test_get_members(self, auth_client: AsyncClient, org: dict):
        r = await auth_client.get(f"/api/orgs/{org['id']}/members")
        assert r.status_code == 200
        assert len(r.json()) == 1
        assert r.json()[0]["role"] == "owner"

    async def test_update_member_role(self, auth_client: AsyncClient, org: dict, make_member):
        member_client = await make_member("member@test.com", role="employee")
        members = (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
        member = next(m for m in members if m["user"]["email"] == "member@test.com")

        r = await auth_client.patch(
            f"/api/orgs/{org['id']}/members/{member['user']['id']}",
            json={"role": "manager"},
        )
        assert r.status_code == 200
        assert r.json()["role"] == "manager"

    async def test_cannot_change_owner_role(self, auth_client: AsyncClient, org: dict, registered_user: dict):
        r = await auth_client.patch(
            f"/api/orgs/{org['id']}/members/{registered_user['id']}",
            json={"role": "admin"},
        )
        assert r.status_code == 403

    async def test_remove_member(self, auth_client: AsyncClient, org: dict, make_member):
        member_client = await make_member("member@test.com")
        members = (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
        member = next(m for m in members if m["user"]["email"] == "member@test.com")

        r = await auth_client.delete(f"/api/orgs/{org['id']}/members/{member['user']['id']}")
        assert r.status_code == 204

    async def test_cannot_remove_owner(self, auth_client: AsyncClient, org: dict, registered_user: dict):
        r = await auth_client.delete(f"/api/orgs/{org['id']}/members/{registered_user['id']}")
        assert r.status_code == 403

    async def test_employee_cannot_remove_member(self, auth_client: AsyncClient, org: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")
        members = (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
        owner = next(m for m in members if m["role"] == "owner")

        r = await employee.delete(f"/api/orgs/{org['id']}/members/{owner['user']['id']}")
        assert r.status_code == 403


class TestInvitations:
    async def test_invite_and_accept(self, auth_client: AsyncClient, org: dict, client: AsyncClient):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/invite",
            json={"email": "newuser@test.com", "role": "employee", "position": "Dev"},
        )
        assert r.status_code == 201
        token = r.json()["token"]

        await client.post(
            "/api/auth/cookie/register",
            json={"email": "newuser@test.com", "password": "Test1234!", "display_name": "New User"},
        )
        await client.post(
            "/api/auth/cookie/login",
            data={"username": "newuser@test.com", "password": "Test1234!"},
        )

        r = await client.post(f"/api/invitations/{token}/accept")
        assert r.status_code == 204

        members = (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
        emails = [m["user"]["email"] for m in members]
        assert "newuser@test.com" in emails

    async def test_check_invitation(self, auth_client: AsyncClient, org: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/invite",
            json={"email": "check@test.com", "role": "employee", "position": "Dev"},
        )
        token = r.json()["token"]

        r = await auth_client.get(f"/api/invitations/{token}")
        assert r.status_code == 200
        assert r.json()["email"] == "check@test.com"

    async def test_accept_twice(self, auth_client: AsyncClient, org: dict, make_member):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/invite",
            json={"email": "twice@test.com", "role": "employee", "position": "Dev"},
        )
        token = r.json()["token"]
        member = await make_member("twice@test.com")

        r = await member.post(f"/api/invitations/{token}/accept")
        assert r.status_code == 409

    async def test_wrong_email_accept(self, auth_client: AsyncClient, org: dict, client: AsyncClient):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/invite",
            json={"email": "target@test.com", "role": "employee", "position": "Dev"},
        )
        token = r.json()["token"]

        await client.post(
            "/api/auth/cookie/register",
            json={"email": "other@test.com", "password": "Test1234!", "display_name": "Other"},
        )
        await client.post(
            "/api/auth/cookie/login",
            data={"username": "other@test.com", "password": "Test1234!"},
        )
        r = await client.post(f"/api/invitations/{token}/accept")
        assert r.status_code == 403

    async def test_employee_cannot_invite(self, org: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")
        r = await employee.post(
            f"/api/orgs/{org['id']}/invite",
            json={"email": "new@test.com", "role": "employee", "position": "Dev"},
        )
        assert r.status_code == 403

    async def test_invalid_token(self, client: AsyncClient, registered_user: dict, auth_client: AsyncClient):
        r = await auth_client.get("/api/invitations/invalid-token-xyz")
        assert r.status_code == 404


class TestLeaveRequest:
    async def test_employee_can_request_leave(self, org: dict, make_member):
        member = await make_member("emp@test.com", role="employee")
        r = await member.post(f"/api/orgs/{org['id']}/leave-request")
        assert r.status_code == 201
        assert r.json()["status"] == "pending"

    async def test_owner_cannot_leave(self, auth_client: AsyncClient, org: dict):
        r = await auth_client.post(f"/api/orgs/{org['id']}/leave-request")
        assert r.status_code == 400

    async def test_duplicate_leave_request(self, org: dict, make_member):
        member = await make_member("emp@test.com", role="employee")
        await member.post(f"/api/orgs/{org['id']}/leave-request")
        r = await member.post(f"/api/orgs/{org['id']}/leave-request")
        assert r.status_code == 409

    async def test_approve_leave_request(self, auth_client: AsyncClient, org: dict, make_member):
        member = await make_member("emp@test.com", role="employee")
        r = await member.post(f"/api/orgs/{org['id']}/leave-request")
        request_id = r.json()["id"]

        r = await auth_client.post(f"/api/orgs/{org['id']}/leave-requests/{request_id}/approve")
        assert r.status_code == 204

        members = (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
        emails = [m["user"]["email"] for m in members]
        assert "emp@test.com" not in emails

    async def test_reject_leave_request(self, auth_client: AsyncClient, org: dict, make_member):
        member = await make_member("emp@test.com", role="employee")
        r = await member.post(f"/api/orgs/{org['id']}/leave-request")
        request_id = r.json()["id"]

        r = await auth_client.post(f"/api/orgs/{org['id']}/leave-requests/{request_id}/reject")
        assert r.status_code == 204

        members = (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
        emails = [m["user"]["email"] for m in members]
        assert "emp@test.com" in emails

    async def test_employee_cannot_list_requests(self, org: dict, make_member):
        employee = await make_member("emp@test.com", role="employee")
        r = await employee.get(f"/api/orgs/{org['id']}/leave-requests")
        assert r.status_code == 403

    async def test_manager_cannot_approve_admin_leave(self, auth_client: AsyncClient, org: dict, make_member):
        admin = await make_member("admin@test.com", role="admin")
        manager = await make_member("mgr@test.com", role="manager")

        r = await admin.post(f"/api/orgs/{org['id']}/leave-request")
        request_id = r.json()["id"]

        r = await manager.post(f"/api/orgs/{org['id']}/leave-requests/{request_id}/approve")
        assert r.status_code == 403
