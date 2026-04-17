"""
test_users.py — Tests for /users endpoints.

Covers: CRUD operations, permission enforcement, and edge cases
like duplicate emails and deleting the protected admin account.
"""


# ---------------------------------------------------------------------------
# GET /users/me
# ---------------------------------------------------------------------------

def test_get_my_profile(client, admin_token):
    """Authenticated user can fetch their own profile."""
    response = client.get("/users/me", headers=admin_token)
    assert response.status_code == 200
    assert response.json()["email"] == "admin@sentinel.io"
    assert response.json()["is_admin"] is True


# ---------------------------------------------------------------------------
# GET /users
# ---------------------------------------------------------------------------

def test_admin_can_list_users(client, admin_token):
    """Admin sees the full user list."""
    response = client.get("/users", headers=admin_token)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_regular_user_cannot_list_users(client, admin_token):
    """Regular user with no permissions cannot access the user list."""
    # Create a user with no permissions
    client.post("/users", json={
        "email": "regular@sentinel.io",
        "full_name": "Regular User",
        "password": "pass1234"
    }, headers=admin_token)

    # Log in as that user
    token_resp = client.post("/auth/login", json={
        "email": "regular@sentinel.io",
        "password": "pass1234"
    })
    user_token = {"Authorization": f"Bearer {token_resp.json()['access_token']}"}

    response = client.get("/users", headers=user_token)
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# POST /users
# ---------------------------------------------------------------------------

def test_admin_can_create_user(client, admin_token):
    """Admin can create a new user and the response excludes hashed_password."""
    response = client.post("/users", json={
        "email": "newuser@sentinel.io",
        "full_name": "New User",
        "password": "securepass"
    }, headers=admin_token)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@sentinel.io"
    assert "hashed_password" not in data


def test_duplicate_email_rejected(client, admin_token):
    """Creating a user with an already-registered email returns 400."""
    payload = {
        "email": "dup@sentinel.io",
        "full_name": "Dup User",
        "password": "pass1234"
    }
    client.post("/users", json=payload, headers=admin_token)
    response = client.post("/users", json=payload, headers=admin_token)
    assert response.status_code == 400


def test_user_with_create_permission_can_create(client, admin_token):
    """A non-admin user granted can_create_user can create new users."""
    # Create a user with create permission
    client.post("/users", json={
        "email": "creator@sentinel.io",
        "full_name": "Creator",
        "password": "pass1234",
        "can_create_user": True
    }, headers=admin_token)

    token_resp = client.post("/auth/login", json={
        "email": "creator@sentinel.io",
        "password": "pass1234"
    })
    creator_token = {"Authorization": f"Bearer {token_resp.json()['access_token']}"}

    response = client.post("/users", json={
        "email": "created@sentinel.io",
        "full_name": "Created User",
        "password": "pass1234"
    }, headers=creator_token)
    assert response.status_code == 201


def test_user_without_create_permission_cannot_create(client, admin_token):
    """A user without can_create_user gets 403 when trying to create."""
    client.post("/users", json={
        "email": "nocreate@sentinel.io",
        "full_name": "No Create",
        "password": "pass1234"
    }, headers=admin_token)

    token_resp = client.post("/auth/login", json={
        "email": "nocreate@sentinel.io",
        "password": "pass1234"
    })
    user_token = {"Authorization": f"Bearer {token_resp.json()['access_token']}"}

    response = client.post("/users", json={
        "email": "blocked@sentinel.io",
        "full_name": "Blocked",
        "password": "pass1234"
    }, headers=user_token)
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# GET /users/{id}
# ---------------------------------------------------------------------------

def test_admin_can_get_any_user(client, admin_token):
    """Admin can fetch any user by ID."""
    client.post("/users", json={
        "email": "target@sentinel.io",
        "full_name": "Target",
        "password": "pass1234"
    }, headers=admin_token)

    users = client.get("/users", headers=admin_token).json()
    target = next(u for u in users if u["email"] == "target@sentinel.io")

    response = client.get(f"/users/{target['id']}", headers=admin_token)
    assert response.status_code == 200
    assert response.json()["email"] == "target@sentinel.io"


def test_user_cannot_get_another_user(client, admin_token):
    """Regular user cannot fetch another user's profile."""
    # Create two users
    for email in ["user_a@sentinel.io", "user_b@sentinel.io"]:
        client.post("/users", json={
            "email": email,
            "full_name": email,
            "password": "pass1234"
        }, headers=admin_token)

    token_a = client.post("/auth/login", json={
        "email": "user_a@sentinel.io", "password": "pass1234"
    }).json()["access_token"]

    users = client.get("/users", headers=admin_token).json()
    user_b = next(u for u in users if u["email"] == "user_b@sentinel.io")

    response = client.get(f"/users/{user_b['id']}", headers={
        "Authorization": f"Bearer {token_a}"
    })
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# PUT /users/{id}
# ---------------------------------------------------------------------------

def test_admin_can_update_user(client, admin_token):
    """Admin can update any user's name."""
    client.post("/users", json={
        "email": "updateme@sentinel.io",
        "full_name": "Before",
        "password": "pass1234"
    }, headers=admin_token)

    users = client.get("/users", headers=admin_token).json()
    user = next(u for u in users if u["email"] == "updateme@sentinel.io")

    response = client.put(f"/users/{user['id']}", json={
        "full_name": "After"
    }, headers=admin_token)
    assert response.status_code == 200
    assert response.json()["full_name"] == "After"


def test_non_admin_cannot_change_permissions(client, admin_token):
    """A user with can_update_user cannot escalate another user's permissions."""
    # Create an updater
    client.post("/users", json={
        "email": "updater@sentinel.io",
        "full_name": "Updater",
        "password": "pass1234",
        "can_update_user": True
    }, headers=admin_token)

    # Create a target
    client.post("/users", json={
        "email": "target2@sentinel.io",
        "full_name": "Target",
        "password": "pass1234"
    }, headers=admin_token)

    updater_token = client.post("/auth/login", json={
        "email": "updater@sentinel.io", "password": "pass1234"
    }).json()["access_token"]

    users = client.get("/users", headers=admin_token).json()
    target = next(u for u in users if u["email"] == "target2@sentinel.io")

    # Attempt to grant is_admin — should be silently ignored (non-admins can't change flags)
    response = client.put(f"/users/{target['id']}", json={
        "is_admin": True
    }, headers={"Authorization": f"Bearer {updater_token}"})
    assert response.status_code == 200
    assert response.json()["is_admin"] is False  # Flag was not applied


# ---------------------------------------------------------------------------
# DELETE /users/{id}
# ---------------------------------------------------------------------------

def test_admin_can_delete_user(client, admin_token):
    """Admin can delete a regular user."""
    client.post("/users", json={
        "email": "deleteme@sentinel.io",
        "full_name": "Delete Me",
        "password": "pass1234"
    }, headers=admin_token)

    users = client.get("/users", headers=admin_token).json()
    user = next(u for u in users if u["email"] == "deleteme@sentinel.io")

    response = client.delete(f"/users/{user['id']}", headers=admin_token)
    assert response.status_code == 204


def test_cannot_delete_default_admin(client, admin_token):
    """The seed admin account cannot be deleted via the API."""
    users = client.get("/users", headers=admin_token).json()
    admin = next(u for u in users if u["email"] == "admin@sentinel.io")

    response = client.delete(f"/users/{admin['id']}", headers=admin_token)
    assert response.status_code == 403


def test_delete_nonexistent_user(client, admin_token):
    """Deleting a user that does not exist returns 404."""
    import uuid
    fake_id = str(uuid.uuid4())
    response = client.delete(f"/users/{fake_id}", headers=admin_token)
    assert response.status_code == 404
