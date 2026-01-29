def test_login_user(client):
    # First register
    client.post(
        "/auth/register",
        json={
            "email": "login@test.com",
            "password": "test123",
        }
    )

    # Now login
    response = client.post(
        "/auth/login",
        json={
            "email": "login@test.com",
            "password": "test123"
        }
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
