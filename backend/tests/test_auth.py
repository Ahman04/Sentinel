"""
test_auth.py — Tests for POST /auth/login.

Covers: valid login, wrong password, unknown email,
inactive account, and missing fields.
"""


def test_login_success(client):
    """Seed admin can log in and receives a bearer token."""
    response = client.post("/auth/login", json={
        "email": "admin@sentinel.io",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    """Wrong password returns 401 — same message as unknown email."""
    response = client.post("/auth/login", json={
        "email": "admin@sentinel.io",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_unknown_email(client):
    """Unknown email returns 401 — does not reveal whether email exists."""
    response = client.post("/auth/login", json={
        "email": "nobody@sentinel.io",
        "password": "admin123"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_inactive_account(client, admin_token):
    """Deactivated accounts cannot log in even with correct credentials."""
    # Create a regular user
    client.post("/users", json={
        "email": "inactive@sentinel.io",
        "full_name": "Inactive User",
        "password": "password123"
    }, headers=admin_token)

    # Find their ID and deactivate them
    users = client.get("/users", headers=admin_token).json()
    user = next(u for u in users if u["email"] == "inactive@sentinel.io")

    client.put(f"/users/{user['id']}", json={"is_active": False}, headers=admin_token)

    # Login should now fail
    response = client.post("/auth/login", json={
        "email": "inactive@sentinel.io",
        "password": "password123"
    })
    assert response.status_code == 401


def test_login_missing_fields(client):
    """Request missing required fields returns 422 Unprocessable Entity."""
    response = client.post("/auth/login", json={"email": "admin@sentinel.io"})
    assert response.status_code == 422


def test_protected_endpoint_without_token(client):
    """Accessing a protected endpoint without a token returns 403."""
    response = client.get("/users/me")
    assert response.status_code == 403


def test_protected_endpoint_with_invalid_token(client):
    """A tampered or expired token returns 401."""
    response = client.get("/users/me", headers={
        "Authorization": "Bearer this.is.not.valid"
    })
    assert response.status_code == 401
