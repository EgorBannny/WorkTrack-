from fastapi_users.authentication import CookieTransport, BearerTransport

cookie_transport = CookieTransport(cookie_max_age=3600)

bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")
