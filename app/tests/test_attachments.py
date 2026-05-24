from httpx import AsyncClient

JPEG_MAGIC = bytes([0xFF, 0xD8, 0xFF, 0xE0]) + b"\x00" * 200
PNG_MAGIC = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) + b"\x00" * 200
PDF_MAGIC = b"%PDF-1.4\n" + b"\x00" * 200
FAKE_PHP = b"<?php echo 'hack'; ?>"
FAKE_HTML = b"<html><script>alert('xss')</script></html>"
FAKE_EXE = b"MZ" + b"\x00" * 200


def jpeg_file(name: str = "photo.jpg"):
    return ("file", (name, JPEG_MAGIC, "image/jpeg"))


def png_file(name: str = "image.png"):
    return ("file", (name, PNG_MAGIC, "image/png"))


class TestAttachmentUpload:
    async def test_upload_jpeg(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[jpeg_file()],
        )
        assert r.status_code == 201
        data = r.json()
        assert data["filename"] == "photo.jpg"
        assert data["mime_type"] == "image/jpeg"

    async def test_upload_png(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[png_file()],
        )
        assert r.status_code == 201

    async def test_upload_forbidden_php(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[("file", ("script.php", FAKE_PHP, "text/plain"))],
        )
        assert r.status_code == 400

    async def test_upload_forbidden_html(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[("file", ("page.html", FAKE_HTML, "text/html"))],
        )
        assert r.status_code == 400

    async def test_upload_exe_renamed_as_jpg(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[("file", ("photo.jpg", FAKE_EXE, "image/jpeg"))],
        )
        assert r.status_code == 400

    async def test_upload_too_large(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        big_content = b"\x00" * (21 * 1024 * 1024)
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[("file", ("big.bin", big_content, "application/octet-stream"))],
        )
        assert r.status_code == 400


class TestAttachmentList:
    async def test_get_attachments(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[jpeg_file()],
        )
        r = await auth_client.get(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments"
        )
        assert r.status_code == 200
        assert len(r.json()) == 1

    async def test_empty_attachments(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.get(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments"
        )
        assert r.status_code == 200
        assert r.json() == []


class TestAttachmentDownload:
    async def test_download_attachment(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[jpeg_file()],
        )
        attachment_id = r.json()["id"]

        r = await auth_client.get(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments/{attachment_id}/download"
        )
        assert r.status_code == 200
        assert r.content[:4] == JPEG_MAGIC[:4]


class TestAttachmentDelete:
    async def test_delete_own_attachment(self, auth_client: AsyncClient, org: dict, project: dict, task: dict):
        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[jpeg_file()],
        )
        attachment_id = r.json()["id"]

        r = await auth_client.delete(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments/{attachment_id}"
        )
        assert r.status_code == 204

    async def test_employee_cannot_delete_others_attachment(
        self, auth_client: AsyncClient, org: dict, project: dict, task: dict, make_member
    ):
        employee = await make_member("emp@test.com", role="employee")
        members = (await auth_client.get(f"/api/orgs/{org['id']}/members")).json()
        emp = next(m for m in members if m["user"]["email"] == "emp@test.com")
        await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/members",
            params={"user_id": emp["user"]["id"]},
        )

        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[jpeg_file()],
        )
        attachment_id = r.json()["id"]

        r = await employee.delete(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments/{attachment_id}"
        )
        assert r.status_code == 403

    async def test_manager_can_delete_others_attachment(
        self, auth_client: AsyncClient, org: dict, project: dict, task: dict, make_member
    ):
        manager = await make_member("mgr@test.com", role="manager")

        r = await auth_client.post(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments",
            files=[jpeg_file()],
        )
        attachment_id = r.json()["id"]

        r = await manager.delete(
            f"/api/orgs/{org['id']}/projects/{project['id']}/tasks/{task['id']}/attachments/{attachment_id}"
        )
        assert r.status_code == 204
