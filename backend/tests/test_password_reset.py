"""
Password Reset Feature Tests
Tests for POST /api/auth/password-reset/request and /api/auth/password-reset/confirm endpoints
"""
import pytest
import requests
import os
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# MongoDB connection for direct DB operations
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


@pytest.fixture(scope="module")
def mongo_client():
    """MongoDB client for test data setup"""
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(autouse=True)
def cleanup_test_codes(mongo_client):
    """Cleanup test codes before and after each test"""
    # Cleanup before test
    mongo_client.password_resets.delete_many({"token": {"$in": ["TEST01", "TEST02", "TEST03", "TEST04"]}})
    yield
    # Cleanup after test
    mongo_client.password_resets.delete_many({"token": {"$in": ["TEST01", "TEST02", "TEST03", "TEST04"]}})


class TestPasswordResetRequest:
    """Tests for POST /api/auth/password-reset/request"""

    def test_reset_request_existing_user_verified_email(self, api_client, mongo_client):
        """Request reset for existing user with Resend-verified email - should return success and store code"""
        # Use 3dotsconnected@gmail.com which is verified in Resend test mode
        response = api_client.post(f"{BASE_URL}/api/auth/password-reset/request", json={
            "email": "3dotsconnected@gmail.com",
            "tenant_id": "santa-gadea"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Si el email existe" in data["message"]
        
        # Verify code was stored in DB
        reset = mongo_client.password_resets.find_one(
            {"email": "3dotsconnected@gmail.com", "tenant_id": "santa-gadea"},
            {"_id": 0}
        )
        assert reset is not None
        assert "token" in reset
        assert len(reset["token"]) == 6  # 6-digit code
        assert reset["used"] == False
    
    def test_reset_request_unverified_email_returns_500(self, api_client):
        """Request reset for unverified Resend email - returns 500 (Resend test mode limitation)"""
        # Note: In Resend test mode, only verified emails work. Other emails return 500.
        response = api_client.post(f"{BASE_URL}/api/auth/password-reset/request", json={
            "email": "admin@santa-gadea.es",
            "tenant_id": "santa-gadea"
        })
        
        # Resend test mode rejects unverified emails with 500
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "email" in data["detail"].lower() or "error" in data["detail"].lower()

    def test_reset_request_unknown_email_returns_success(self, api_client):
        """Request reset for unknown email - should return success (security)"""
        response = api_client.post(f"{BASE_URL}/api/auth/password-reset/request", json={
            "email": "nonexistent@example.com",
            "tenant_id": "santa-gadea"
        })
        
        # Should return 200 to not leak user existence
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Si el email existe" in data["message"]

    def test_reset_request_replaces_old_code(self, api_client, mongo_client):
        """Requesting reset twice should replace old code"""
        # Use verified email for this test
        email = "3dotsconnected@gmail.com"
        
        # First request
        api_client.post(f"{BASE_URL}/api/auth/password-reset/request", json={
            "email": email,
            "tenant_id": "santa-gadea"
        })
        first_reset = mongo_client.password_resets.find_one(
            {"email": email, "tenant_id": "santa-gadea"},
            {"_id": 0}
        )
        first_code = first_reset["token"]
        
        # Second request
        api_client.post(f"{BASE_URL}/api/auth/password-reset/request", json={
            "email": email,
            "tenant_id": "santa-gadea"
        })
        second_reset = mongo_client.password_resets.find_one(
            {"email": email, "tenant_id": "santa-gadea"},
            {"_id": 0}
        )
        second_code = second_reset["token"]
        
        # Codes should be different (old one deleted)
        # Note: There's a small chance they could be the same randomly
        # But the important thing is only one record exists
        count = mongo_client.password_resets.count_documents(
            {"email": email, "tenant_id": "santa-gadea"}
        )
        assert count == 1


class TestPasswordResetConfirm:
    """Tests for POST /api/auth/password-reset/confirm"""

    def test_confirm_invalid_code(self, api_client):
        """Confirm with invalid code - should return 400"""
        response = api_client.post(f"{BASE_URL}/api/auth/password-reset/confirm", json={
            "token": "000000",
            "new_password": "newpassword123"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "inválido" in data["detail"].lower() or "utilizado" in data["detail"].lower()

    def test_confirm_expired_code(self, api_client, mongo_client):
        """Confirm with expired code - should return 400"""
        # Insert expired code
        mongo_client.password_resets.insert_one({
            "email": "admin@santa-gadea.es",
            "tenant_id": "santa-gadea",
            "token": "TEST01",
            "expires_at": (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat(),
            "used": False
        })
        
        response = api_client.post(f"{BASE_URL}/api/auth/password-reset/confirm", json={
            "token": "TEST01",
            "new_password": "newpassword123"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "expirado" in data["detail"].lower()

    def test_confirm_used_code(self, api_client, mongo_client):
        """Confirm with already used code - should return 400"""
        # Insert used code
        mongo_client.password_resets.insert_one({
            "email": "admin@santa-gadea.es",
            "tenant_id": "santa-gadea",
            "token": "TEST02",
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
            "used": True
        })
        
        response = api_client.post(f"{BASE_URL}/api/auth/password-reset/confirm", json={
            "token": "TEST02",
            "new_password": "newpassword123"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "inválido" in data["detail"].lower() or "utilizado" in data["detail"].lower()

    def test_confirm_short_password(self, api_client, mongo_client):
        """Confirm with password less than 4 chars - should return 400"""
        # Insert valid code
        mongo_client.password_resets.insert_one({
            "email": "admin@santa-gadea.es",
            "tenant_id": "santa-gadea",
            "token": "TEST03",
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
            "used": False
        })
        
        response = api_client.post(f"{BASE_URL}/api/auth/password-reset/confirm", json={
            "token": "TEST03",
            "new_password": "abc"  # Only 3 chars
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "4 caracteres" in data["detail"]

    def test_confirm_valid_code_resets_password(self, api_client, mongo_client):
        """Confirm with valid code - should reset password and mark code as used"""
        # Create a test user for this test
        test_email = "TEST_resetuser@santa-gadea.es"
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Insert test user
        mongo_client.users.delete_many({"email": test_email})
        mongo_client.users.insert_one({
            "id": "test-reset-user-id",
            "email": test_email,
            "password_hash": pwd_context.hash("oldpassword"),
            "tenant_id": "santa-gadea",
            "rol": "user",
            "nombre": "Test Reset User",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        })
        
        # Insert valid code
        mongo_client.password_resets.insert_one({
            "email": test_email,
            "tenant_id": "santa-gadea",
            "token": "TEST04",
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
            "used": False
        })
        
        # Confirm reset
        response = api_client.post(f"{BASE_URL}/api/auth/password-reset/confirm", json={
            "token": "TEST04",
            "new_password": "newpassword123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "actualizada" in data["message"].lower()
        
        # Verify code is marked as used
        reset = mongo_client.password_resets.find_one({"token": "TEST04"}, {"_id": 0})
        assert reset["used"] == True
        
        # Verify can login with new password
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "newpassword123",
            "tenant_id": "santa-gadea"
        })
        assert login_response.status_code == 200
        
        # Verify old password doesn't work
        old_login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "oldpassword",
            "tenant_id": "santa-gadea"
        })
        assert old_login_response.status_code == 401
        
        # Cleanup test user
        mongo_client.users.delete_many({"email": test_email})


class TestFullPasswordResetFlow:
    """End-to-end password reset flow tests"""

    def test_full_reset_flow_with_db_code(self, api_client, mongo_client):
        """Full flow using DB-inserted code (bypasses Resend test mode limitation)"""
        test_email = "TEST_fullflow@santa-gadea.es"
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Setup: Create test user
        mongo_client.users.delete_many({"email": test_email})
        mongo_client.users.insert_one({
            "id": "test-fullflow-user-id",
            "email": test_email,
            "password_hash": pwd_context.hash("originalpass"),
            "tenant_id": "santa-gadea",
            "rol": "user",
            "nombre": "Test Full Flow User",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        })
        
        try:
            # Step 1: Insert code directly (simulating what request endpoint does)
            test_code = "FLOW01"
            mongo_client.password_resets.delete_many({"email": test_email})
            mongo_client.password_resets.insert_one({
                "email": test_email,
                "tenant_id": "santa-gadea",
                "token": test_code,
                "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
                "used": False
            })
            
            # Step 2: Confirm with code
            confirm_response = api_client.post(f"{BASE_URL}/api/auth/password-reset/confirm", json={
                "token": test_code,
                "new_password": "brandnewpass"
            })
            assert confirm_response.status_code == 200
            
            # Step 3: Login with new password
            login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
                "email": test_email,
                "password": "brandnewpass",
                "tenant_id": "santa-gadea"
            })
            assert login_response.status_code == 200
            login_data = login_response.json()
            assert "access_token" in login_data
            assert login_data["user"]["email"] == test_email
            
            # Step 4: Verify old password rejected
            old_login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
                "email": test_email,
                "password": "originalpass",
                "tenant_id": "santa-gadea"
            })
            assert old_login_response.status_code == 401
            
        finally:
            # Cleanup
            mongo_client.users.delete_many({"email": test_email})
            mongo_client.password_resets.delete_many({"email": test_email})
    
    def test_full_reset_flow_verified_email(self, api_client, mongo_client):
        """Full flow with Resend-verified email (3dotsconnected@gmail.com)"""
        # This test uses the verified email that works with Resend test mode
        email = "3dotsconnected@gmail.com"
        
        # Step 1: Request password reset (this will actually send email)
        request_response = api_client.post(f"{BASE_URL}/api/auth/password-reset/request", json={
            "email": email,
            "tenant_id": "santa-gadea"
        })
        assert request_response.status_code == 200
        
        # Step 2: Get code from DB (simulating email receipt)
        reset = mongo_client.password_resets.find_one(
            {"email": email, "tenant_id": "santa-gadea", "used": False},
            {"_id": 0}
        )
        assert reset is not None
        code = reset["token"]
        
        # Step 3: Confirm with code
        confirm_response = api_client.post(f"{BASE_URL}/api/auth/password-reset/confirm", json={
            "token": code,
            "new_password": "nuevapass"
        })
        assert confirm_response.status_code == 200
        
        # Step 4: Login with new password
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": "nuevapass",
            "tenant_id": "santa-gadea"
        })
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert "access_token" in login_data
        assert login_data["user"]["email"] == email
