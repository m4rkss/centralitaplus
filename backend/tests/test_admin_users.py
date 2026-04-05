"""
Test Admin User Management Endpoints (P1 Feature)
- POST /api/admin/users - create user (admin only)
- GET /api/admin/users - list users (admin only)
- PATCH /api/admin/users/{id} - update user (admin only)
- DELETE /api/admin/users/{id} - delete user (admin only)
- 403 Forbidden for non-admin users
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "admin@santa-gadea.es"
ADMIN_PASSWORD = "pass123"
USER_EMAIL = "secretaria@santa-gadea.es"
USER_PASSWORD = "pass123"
TENANT_ID = "santa-gadea"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin JWT token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
        "tenant_id": TENANT_ID
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    assert "access_token" in data
    assert data["user"]["rol"] == "admin"
    return data["access_token"]


@pytest.fixture(scope="module")
def user_token():
    """Get non-admin user JWT token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASSWORD,
        "tenant_id": TENANT_ID
    })
    assert response.status_code == 200, f"User login failed: {response.text}"
    data = response.json()
    assert "access_token" in data
    assert data["user"]["rol"] == "user"
    return data["access_token"]


@pytest.fixture
def admin_headers(admin_token):
    """Headers with admin auth"""
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }


@pytest.fixture
def user_headers(user_token):
    """Headers with non-admin auth"""
    return {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json"
    }


class TestAdminUserList:
    """Test GET /api/admin/users"""
    
    def test_list_users_as_admin(self, admin_headers):
        """Admin can list users"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert isinstance(data["users"], list)
        assert len(data["users"]) >= 2  # At least admin and secretaria
        
        # Verify user structure
        for user in data["users"]:
            assert "id" in user
            assert "email" in user
            assert "tenant_id" in user
            assert "rol" in user
            assert "password_hash" not in user  # Should not expose password
    
    def test_list_users_as_non_admin_forbidden(self, user_headers):
        """Non-admin gets 403 Forbidden"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=user_headers)
        assert response.status_code == 403
        data = response.json()
        assert "detail" in data
        assert "admin" in data["detail"].lower() or "Solo" in data["detail"]


class TestAdminUserCreate:
    """Test POST /api/admin/users"""
    
    def test_create_user_as_admin(self, admin_headers):
        """Admin can create a new user"""
        test_email = f"TEST_newuser_{os.urandom(4).hex()}@santa-gadea.es"
        payload = {
            "email": test_email,
            "password": "testpass123",
            "nombre": "Test User Created",
            "rol": "user"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/users", headers=admin_headers, json=payload)
        assert response.status_code == 200, f"Create failed: {response.text}"
        
        data = response.json()
        assert data["email"] == test_email
        assert data["nombre"] == "Test User Created"
        assert data["rol"] == "user"
        assert data["tenant_id"] == TENANT_ID
        assert "id" in data
        
        # Verify user was persisted - GET list and check
        list_response = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        users = list_response.json()["users"]
        created_user = next((u for u in users if u["email"] == test_email), None)
        assert created_user is not None, "Created user not found in list"
        
        # Cleanup - delete the test user
        requests.delete(f"{BASE_URL}/api/admin/users/{data['id']}", headers=admin_headers)
    
    def test_create_admin_user(self, admin_headers):
        """Admin can create another admin user"""
        test_email = f"TEST_admin_{os.urandom(4).hex()}@santa-gadea.es"
        payload = {
            "email": test_email,
            "password": "adminpass123",
            "nombre": "Test Admin",
            "rol": "admin"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/users", headers=admin_headers, json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["rol"] == "admin"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{data['id']}", headers=admin_headers)
    
    def test_create_user_duplicate_email_returns_409(self, admin_headers):
        """Creating user with existing email returns 409 Conflict"""
        payload = {
            "email": ADMIN_EMAIL,  # Already exists
            "password": "testpass",
            "nombre": "Duplicate",
            "rol": "user"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/users", headers=admin_headers, json=payload)
        assert response.status_code == 409
        data = response.json()
        assert "detail" in data
        assert "email" in data["detail"].lower() or "existe" in data["detail"].lower()
    
    def test_create_user_invalid_rol_returns_400(self, admin_headers):
        """Creating user with invalid rol returns 400"""
        payload = {
            "email": f"TEST_invalid_{os.urandom(4).hex()}@santa-gadea.es",
            "password": "testpass",
            "nombre": "Invalid Rol",
            "rol": "superadmin"  # Invalid rol
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/users", headers=admin_headers, json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    def test_create_user_as_non_admin_forbidden(self, user_headers):
        """Non-admin gets 403 when trying to create user"""
        payload = {
            "email": "forbidden@santa-gadea.es",
            "password": "testpass",
            "nombre": "Forbidden",
            "rol": "user"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/users", headers=user_headers, json=payload)
        assert response.status_code == 403


class TestAdminUserUpdate:
    """Test PATCH /api/admin/users/{id}"""
    
    def test_update_user_as_admin(self, admin_headers):
        """Admin can update a user"""
        # First create a user to update
        test_email = f"TEST_update_{os.urandom(4).hex()}@santa-gadea.es"
        create_response = requests.post(f"{BASE_URL}/api/admin/users", headers=admin_headers, json={
            "email": test_email,
            "password": "testpass",
            "nombre": "Original Name",
            "rol": "user"
        })
        assert create_response.status_code == 200
        user_id = create_response.json()["id"]
        
        # Update the user
        update_payload = {
            "nombre": "Updated Name",
            "rol": "admin"
        }
        update_response = requests.patch(f"{BASE_URL}/api/admin/users/{user_id}", headers=admin_headers, json=update_payload)
        assert update_response.status_code == 200
        
        updated_data = update_response.json()
        assert updated_data["nombre"] == "Updated Name"
        assert updated_data["rol"] == "admin"
        assert updated_data["email"] == test_email  # Email unchanged
        
        # Verify persistence
        list_response = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        users = list_response.json()["users"]
        updated_user = next((u for u in users if u["id"] == user_id), None)
        assert updated_user["nombre"] == "Updated Name"
        assert updated_user["rol"] == "admin"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{user_id}", headers=admin_headers)
    
    def test_update_user_email(self, admin_headers):
        """Admin can update user email"""
        # Create user
        test_email = f"TEST_email_{os.urandom(4).hex()}@santa-gadea.es"
        create_response = requests.post(f"{BASE_URL}/api/admin/users", headers=admin_headers, json={
            "email": test_email,
            "password": "testpass",
            "nombre": "Email Test",
            "rol": "user"
        })
        user_id = create_response.json()["id"]
        
        # Update email
        new_email = f"TEST_newemail_{os.urandom(4).hex()}@santa-gadea.es"
        update_response = requests.patch(f"{BASE_URL}/api/admin/users/{user_id}", headers=admin_headers, json={
            "email": new_email
        })
        assert update_response.status_code == 200
        assert update_response.json()["email"] == new_email
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{user_id}", headers=admin_headers)
    
    def test_update_user_duplicate_email_returns_409(self, admin_headers):
        """Updating to existing email returns 409"""
        # Create user
        test_email = f"TEST_dup_{os.urandom(4).hex()}@santa-gadea.es"
        create_response = requests.post(f"{BASE_URL}/api/admin/users", headers=admin_headers, json={
            "email": test_email,
            "password": "testpass",
            "nombre": "Dup Test",
            "rol": "user"
        })
        user_id = create_response.json()["id"]
        
        # Try to update to existing email
        update_response = requests.patch(f"{BASE_URL}/api/admin/users/{user_id}", headers=admin_headers, json={
            "email": ADMIN_EMAIL  # Already exists
        })
        assert update_response.status_code == 409
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{user_id}", headers=admin_headers)
    
    def test_update_nonexistent_user_returns_404(self, admin_headers):
        """Updating non-existent user returns 404"""
        response = requests.patch(f"{BASE_URL}/api/admin/users/nonexistent-id-12345", headers=admin_headers, json={
            "nombre": "Test"
        })
        assert response.status_code == 404
    
    def test_update_user_as_non_admin_forbidden(self, user_headers, admin_headers):
        """Non-admin gets 403 when trying to update user"""
        # Get an existing user ID
        list_response = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        users = list_response.json()["users"]
        user_id = users[0]["id"]
        
        response = requests.patch(f"{BASE_URL}/api/admin/users/{user_id}", headers=user_headers, json={
            "nombre": "Hacked"
        })
        assert response.status_code == 403


class TestAdminUserDelete:
    """Test DELETE /api/admin/users/{id}"""
    
    def test_delete_user_as_admin(self, admin_headers):
        """Admin can delete a user"""
        # Create user to delete
        test_email = f"TEST_delete_{os.urandom(4).hex()}@santa-gadea.es"
        create_response = requests.post(f"{BASE_URL}/api/admin/users", headers=admin_headers, json={
            "email": test_email,
            "password": "testpass",
            "nombre": "To Delete",
            "rol": "user"
        })
        user_id = create_response.json()["id"]
        
        # Delete the user
        delete_response = requests.delete(f"{BASE_URL}/api/admin/users/{user_id}", headers=admin_headers)
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert "message" in data
        
        # Verify user no longer exists
        list_response = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        users = list_response.json()["users"]
        deleted_user = next((u for u in users if u["id"] == user_id), None)
        assert deleted_user is None, "Deleted user still exists in list"
    
    def test_delete_self_returns_400(self, admin_headers, admin_token):
        """Admin cannot delete themselves"""
        # Get admin's own user ID
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=admin_headers)
        admin_id = me_response.json()["id"]
        
        # Try to delete self
        delete_response = requests.delete(f"{BASE_URL}/api/admin/users/{admin_id}", headers=admin_headers)
        assert delete_response.status_code == 400
        data = delete_response.json()
        assert "detail" in data
        assert "ti mismo" in data["detail"].lower() or "yourself" in data["detail"].lower() or "eliminarte" in data["detail"].lower()
    
    def test_delete_nonexistent_user_returns_404(self, admin_headers):
        """Deleting non-existent user returns 404"""
        response = requests.delete(f"{BASE_URL}/api/admin/users/nonexistent-id-12345", headers=admin_headers)
        assert response.status_code == 404
    
    def test_delete_user_as_non_admin_forbidden(self, user_headers, admin_headers):
        """Non-admin gets 403 when trying to delete user"""
        # Get an existing user ID
        list_response = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        users = list_response.json()["users"]
        user_id = users[0]["id"]
        
        response = requests.delete(f"{BASE_URL}/api/admin/users/{user_id}", headers=user_headers)
        assert response.status_code == 403


class TestAuthEndpoints:
    """Verify auth endpoints still work correctly"""
    
    def test_login_admin(self):
        """Admin login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "tenant_id": TENANT_ID
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["rol"] == "admin"
    
    def test_login_user(self):
        """Regular user login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "tenant_id": TENANT_ID
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["rol"] == "user"
    
    def test_get_me_admin(self, admin_headers):
        """GET /api/auth/me returns admin info"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["rol"] == "admin"
    
    def test_get_me_user(self, user_headers):
        """GET /api/auth/me returns user info"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=user_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == USER_EMAIL
        assert data["rol"] == "user"
