from httpx import AsyncClient

from .conftest import DEFAULT_EMAIL, DEFAULT_PASSWORD, DEFAULT_DISPLAY_NAME


class TestRegister:
    async def test_success(self, client: AsyncClient):
        r = await client.post(
            "/api/auth/cookie/register",
            json={"email": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD, "display_name": DEFAULT_DISPLAY_NAME},
        )
        assert r.status_code == 201
        data = r.json()
        assert data["email"] == DEFAULT_EMAIL
        assert data["display_name"] == DEFAULT_DISPLAY_NAME
        assert "id" in data

    async def test_duplicate_email(self, client: AsyncClient, registered_user: dict):
        r = await client.post(
            "/api/auth/cookie/register",
            json={"email": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD, "display_name": DEFAULT_DISPLAY_NAME},
        )
        assert r.status_code == 400

    async def test_weak_password(self, client: AsyncClient):
        r = await client.post(
            "/api/auth/cookie/register",
            json={"email": "new@test.com", "password": "123", "display_name": "User"},
        )
        assert r.status_code == 400


class TestCookieLogin:
    async def test_success(self, client: AsyncClient, registered_user: dict):
        r = await client.post(
            "/api/auth/cookie/login",
            data={"username": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD},
        )
        assert r.status_code == 204
        assert "access_token" in r.cookies

    async def test_wrong_password(self, client: AsyncClient, registered_user: dict):
        r = await client.post(
            "/api/auth/cookie/login",
            data={"username": DEFAULT_EMAIL, "password": "wrongpass"},
        )
        assert r.status_code == 400

    async def test_nonexistent_user(self, client: AsyncClient):
        r = await client.post(
            "/api/auth/cookie/login",
            data={"username": "nobody@test.com", "password": DEFAULT_PASSWORD},
        )
        assert r.status_code == 400

    async def test_authenticated_request(self, auth_client: AsyncClient):
        r = await auth_client.get("/api/users/me")
        assert r.status_code == 200
        assert r.json()["email"] == DEFAULT_EMAIL


class TestBearerLogin:
    async def test_success(self, client: AsyncClient, registered_user: dict):
        r = await client.post(
            "/api/auth/bearer/login",
            data={"username": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD},
        )
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_authenticated_request(self, client: AsyncClient, registered_user: dict):
        r = await client.post(
            "/api/auth/bearer/login",
            data={"username": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD},
        )
        token = r.json()["access_token"]
        r = await client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200


class TestLogout:
    async def test_logout_success(self, auth_client: AsyncClient):
        r = await auth_client.post("/api/auth/cookie/logout")
        assert r.status_code == 204

    async def test_logout_invalidates_token(self, auth_client: AsyncClient):
        token = auth_client.cookies.get("access_token")
        await auth_client.post("/api/auth/cookie/logout")
        auth_client.cookies.set("access_token", token)
        r = await auth_client.get("/api/users/me")
        assert r.status_code == 401

    async def test_logout_unauthenticated(self, client: AsyncClient):
        r = await client.post("/api/auth/cookie/logout")
        assert r.status_code == 401

    async def test_logout_all(self, auth_client: AsyncClient):
        r = await auth_client.post("/api/auth/cookie/logout-all")
        assert r.status_code == 204


class TestRefresh:
    async def test_refresh_success(self, auth_client: AsyncClient):
        r = await auth_client.post("/api/auth/cookie/refresh")
        assert r.status_code == 204
        assert "access_token" in r.cookies

    async def test_refresh_unauthenticated(self, client: AsyncClient):
        r = await client.post("/api/auth/cookie/refresh")
        assert r.status_code == 401


class TestMe:
    async def test_get_me(self, auth_client: AsyncClient):
        r = await auth_client.get("/api/users/me")
        assert r.status_code == 200
        assert r.json()["email"] == DEFAULT_EMAIL

    async def test_update_me(self, auth_client: AsyncClient):
        r = await auth_client.patch("/api/users/me", json={"display_name": "Updated Name"})
        assert r.status_code == 200
        assert r.json()["display_name"] == "Updated Name"

    async def test_deactivate_account(self, auth_client: AsyncClient):
        r = await auth_client.delete("/api/users/me")
        assert r.status_code == 204
        r = await auth_client.get("/api/users/me")
        assert r.status_code == 401
