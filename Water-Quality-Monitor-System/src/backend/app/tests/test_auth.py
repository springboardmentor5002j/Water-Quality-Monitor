def test_authorized_access(client):
    # Register user
    client.post("/auth/register", json={
        "email": "auth@test.com",
        "password": "123456"
    })

    # Login
    res = client.post("/auth/login", json={
        "email": "auth@test.com",
        "password": "123456"
    })

    token = res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    protected = client.get("/auth/protected", headers=headers)

    assert protected.status_code == 200


def test_unauthorized_access(client):
    response = client.get("/auth/protected")
    assert response.status_code == 401
