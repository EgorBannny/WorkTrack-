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
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_authenticated_request(self, client: AsyncClient, registered_user: dict):
        r = await client.post(
            "/api/auth/bearer/login",
            data={"username": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD},
        )
        token = r.json()["access_token"]
        r = await client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200

    async def test_bearer_accesses_business_endpoint(self, client: AsyncClient, registered_user: dict):
        r = await client.post(
            "/api/auth/bearer/login",
            data={"username": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD},
        )
        token = r.json()["access_token"]
        r = await client.post(
            "/api/orgs",
            json={"name": "Bearer Org"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 201
        assert r.json()["name"] == "Bearer Org"


class TestBearerLogout:
    async def _login(self, client: AsyncClient) -> dict:
        r = await client.post(
            "/api/auth/bearer/login",
            data={"username": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD},
        )
        return r.json()

    async def test_logout_success(self, client: AsyncClient, registered_user: dict):
        data = await self._login(client)
        r = await client.post(
            "/api/auth/bearer/logout",
            json={"refresh_token": data["refresh_token"]},
            headers={"Authorization": f"Bearer {data['access_token']}"},
        )
        assert r.status_code == 204

    async def test_logout_invalidates_token(self, client: AsyncClient, registered_user: dict):
        data = await self._login(client)
        access_token = data["access_token"]
        await client.post(
            "/api/auth/bearer/logout",
            json={"refresh_token": data["refresh_token"]},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        r = await client.get("/api/users/me", headers={"Authorization": f"Bearer {access_token}"})
        assert r.status_code == 401

    async def test_logout_unauthenticated(self, client: AsyncClient):
        r = await client.post(
            "/api/auth/bearer/logout",
            json={"refresh_token": "invalid"},
        )
        assert r.status_code == 401

    async def test_logout_all(self, client: AsyncClient, registered_user: dict):
        data = await self._login(client)
        r = await client.post(
            "/api/auth/bearer/logout-all",
            headers={"Authorization": f"Bearer {data['access_token']}"},
        )
        assert r.status_code == 204

    async def test_logout_all_invalidates_all_tokens(self, client: AsyncClient, registered_user: dict):
        data1 = await self._login(client)
        data2 = await self._login(client)

        await client.post(
            "/api/auth/bearer/logout-all",
            headers={"Authorization": f"Bearer {data1['access_token']}"},
        )

        r = await client.get("/api/users/me", headers={"Authorization": f"Bearer {data1['access_token']}"})
        assert r.status_code == 401
        r = await client.get("/api/users/me", headers={"Authorization": f"Bearer {data2['access_token']}"})
        assert r.status_code == 401


class TestBearerRefresh:
    async def _login(self, client: AsyncClient) -> dict:
        r = await client.post(
            "/api/auth/bearer/login",
            data={"username": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD},
        )
        return r.json()

    async def test_refresh_success(self, client: AsyncClient, registered_user: dict):
        data = await self._login(client)
        r = await client.post(
            "/api/auth/bearer/refresh",
            json={"access_token": data["access_token"], "refresh_token": data["refresh_token"]},
        )
        assert r.status_code == 200
        new_data = r.json()
        assert "access_token" in new_data
        assert "refresh_token" in new_data
        assert new_data["token_type"] == "bearer"

    async def test_refresh_new_token_works(self, client: AsyncClient, registered_user: dict):
        data = await self._login(client)
        r = await client.post(
            "/api/auth/bearer/refresh",
            json={"access_token": data["access_token"], "refresh_token": data["refresh_token"]},
        )
        new_token = r.json()["access_token"]
        r = await client.get("/api/users/me", headers={"Authorization": f"Bearer {new_token}"})
        assert r.status_code == 200

    async def test_refresh_unauthenticated(self, client: AsyncClient):
        r = await client.post(
            "/api/auth/bearer/refresh",
            json={"access_token": "invalid", "refresh_token": "invalid"},
        )
        assert r.status_code == 401


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
