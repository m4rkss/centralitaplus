#!/usr/bin/env python3
"""
Backend API Testing for Centralita Virtual Auth System
Tests JWT authentication, tenant filtering, and protected endpoints
"""

import requests
import sys
import json
from datetime import datetime

class AuthAPITester:
    def __init__(self, base_url="https://switchboard-pro-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.admin_token = None
        self.user_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, check_response=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        # Merge headers
        test_headers = self.session.headers.copy()
        if headers:
            test_headers.update(headers)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)
            
            success = response.status_code == expected_status
            
            if success:
                print(f"✅ Status Code: {response.status_code} ✓")
                
                # Additional response checks
                if check_response and response.status_code in [200, 201]:
                    try:
                        response_data = response.json()
                        if check_response(response_data):
                            print(f"✅ Response validation: ✓")
                            self.tests_passed += 1
                        else:
                            print(f"❌ Response validation failed")
                            print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
                            success = False
                    except json.JSONDecodeError:
                        print(f"❌ Invalid JSON response")
                        success = False
                else:
                    self.tests_passed += 1
            else:
                print(f"❌ Status Code: Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}...")

            return success, response.json() if success and response.text else {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")
            return False, {}

    def test_tenant_info(self):
        """Test tenant info endpoint"""
        def check_tenant_response(data):
            return (data.get('id') == 'santa-gadea' and 
                   'Santa Gadea' in data.get('nombre', '') and
                   data.get('primary_color') is not None)
        
        return self.run_test(
            "Tenant Info",
            "GET",
            "api/tenant",
            200,
            headers={'X-Tenant-ID': 'santa-gadea'},
            check_response=check_tenant_response
        )

    def test_admin_login(self):
        """Test admin login with correct credentials"""
        def check_login_response(data):
            if (data.get('access_token') and 
                data.get('user', {}).get('email') == 'admin@santa-gadea.es' and
                data.get('user', {}).get('rol') == 'admin'):
                self.admin_token = data['access_token']
                return True
            return False
        
        return self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={
                "email": "admin@santa-gadea.es",
                "password": "pass123",
                "tenant_id": "santa-gadea"
            },
            check_response=check_login_response
        )

    def test_user_login(self):
        """Test user login with correct credentials"""
        def check_login_response(data):
            if (data.get('access_token') and 
                data.get('user', {}).get('email') == 'secretaria@santa-gadea.es' and
                data.get('user', {}).get('rol') == 'user'):
                self.user_token = data['access_token']
                return True
            return False
        
        return self.run_test(
            "User Login",
            "POST",
            "api/auth/login",
            200,
            data={
                "email": "secretaria@santa-gadea.es",
                "password": "pass123",
                "tenant_id": "santa-gadea"
            },
            check_response=check_login_response
        )

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        return self.run_test(
            "Invalid Login",
            "POST",
            "api/auth/login",
            401,
            data={
                "email": "admin@santa-gadea.es",
                "password": "wrongpassword",
                "tenant_id": "santa-gadea"
            }
        )

    def test_wrong_tenant_login(self):
        """Test login with wrong tenant"""
        return self.run_test(
            "Wrong Tenant Login",
            "POST",
            "api/auth/login",
            401,
            data={
                "email": "admin@santa-gadea.es",
                "password": "pass123",
                "tenant_id": "wrong-tenant"
            }
        )

    def test_auth_me_admin(self):
        """Test /auth/me endpoint with admin token"""
        if not self.admin_token:
            print("❌ Admin token not available, skipping test")
            return False, {}
        
        def check_me_response(data):
            return (data.get('email') == 'admin@santa-gadea.es' and
                   data.get('rol') == 'admin' and
                   data.get('tenant_id') == 'santa-gadea')
        
        return self.run_test(
            "Auth Me (Admin)",
            "GET",
            "api/auth/me",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'},
            check_response=check_me_response
        )

    def test_auth_me_user(self):
        """Test /auth/me endpoint with user token"""
        if not self.user_token:
            print("❌ User token not available, skipping test")
            return False, {}
        
        def check_me_response(data):
            return (data.get('email') == 'secretaria@santa-gadea.es' and
                   data.get('rol') == 'user' and
                   data.get('tenant_id') == 'santa-gadea')
        
        return self.run_test(
            "Auth Me (User)",
            "GET",
            "api/auth/me",
            200,
            headers={'Authorization': f'Bearer {self.user_token}'},
            check_response=check_me_response
        )

    def test_auth_me_no_token(self):
        """Test /auth/me endpoint without token"""
        return self.run_test(
            "Auth Me (No Token)",
            "GET",
            "api/auth/me",
            401
        )

    def test_kpis_endpoint(self):
        """Test KPIs endpoint with authentication"""
        if not self.admin_token:
            print("❌ Admin token not available, skipping test")
            return False, {}
        
        def check_kpis_response(data):
            required_fields = ['llamadas_hoy', 'llamadas_semana', 'incidencias_abiertas', 
                             'incidencias_cerradas_semana', 'comunicados_enviados_semana']
            return all(field in data for field in required_fields)
        
        return self.run_test(
            "KPIs Endpoint",
            "GET",
            "api/kpis",
            200,
            headers={
                'Authorization': f'Bearer {self.admin_token}',
                'X-Tenant-ID': 'santa-gadea'
            },
            check_response=check_kpis_response
        )

    def test_kpis_no_auth(self):
        """Test KPIs endpoint without authentication"""
        return self.run_test(
            "KPIs No Auth",
            "GET",
            "api/kpis",
            401
        )

    def test_llamadas_endpoint(self):
        """Test llamadas endpoint with authentication"""
        if not self.admin_token:
            print("❌ Admin token not available, skipping test")
            return False, {}
        
        def check_llamadas_response(data):
            return ('llamadas' in data and 
                   isinstance(data['llamadas'], list) and
                   'total' in data)
        
        return self.run_test(
            "Llamadas Endpoint",
            "GET",
            "api/llamadas",
            200,
            headers={
                'Authorization': f'Bearer {self.admin_token}',
                'X-Tenant-ID': 'santa-gadea'
            },
            check_response=check_llamadas_response
        )

    def test_incidencias_endpoint(self):
        """Test incidencias endpoint with authentication"""
        if not self.admin_token:
            print("❌ Admin token not available, skipping test")
            return False, {}
        
        def check_incidencias_response(data):
            return ('incidencias' in data and 
                   isinstance(data['incidencias'], list))
        
        return self.run_test(
            "Incidencias Endpoint",
            "GET",
            "api/incidencias",
            200,
            headers={
                'Authorization': f'Bearer {self.admin_token}',
                'X-Tenant-ID': 'santa-gadea'
            },
            check_response=check_incidencias_response
        )

    def test_comunicados_endpoint(self):
        """Test comunicados endpoint with authentication"""
        if not self.admin_token:
            print("❌ Admin token not available, skipping test")
            return False, {}
        
        def check_comunicados_response(data):
            return ('comunicados' in data and 
                   isinstance(data['comunicados'], list))
        
        return self.run_test(
            "Comunicados Endpoint",
            "GET",
            "api/comunicados",
            200,
            headers={
                'Authorization': f'Bearer {self.admin_token}',
                'X-Tenant-ID': 'santa-gadea'
            },
            check_response=check_comunicados_response
        )

    def test_chart_data_endpoint(self):
        """Test chart data endpoint"""
        if not self.admin_token:
            print("❌ Admin token not available, skipping test")
            return False, {}
        
        def check_chart_response(data):
            return (isinstance(data, list) and 
                   len(data) > 0 and
                   all('dia' in item and 'llamadas' in item for item in data))
        
        return self.run_test(
            "Chart Data Endpoint",
            "GET",
            "api/llamadas/chart",
            200,
            headers={
                'Authorization': f'Bearer {self.admin_token}',
                'X-Tenant-ID': 'santa-gadea'
            },
            check_response=check_chart_response
        )

    def test_create_incidencia(self):
        """Test creating a new incidencia"""
        if not self.admin_token:
            print("❌ Admin token not available, skipping test")
            return False, {}
        
        def check_create_response(data):
            return (data.get('titulo') == 'Test Incidencia' and
                   data.get('tenant_id') == 'santa-gadea' and
                   data.get('id') is not None)
        
        return self.run_test(
            "Create Incidencia",
            "POST",
            "api/incidencias",
            200,
            data={
                "titulo": "Test Incidencia",
                "descripcion": "Test description",
                "ubicacion": "Test location",
                "prioridad": "media",
                "categoria": "otros"
            },
            headers={
                'Authorization': f'Bearer {self.admin_token}',
                'X-Tenant-ID': 'santa-gadea'
            },
            check_response=check_create_response
        )

    def test_logout_endpoint(self):
        """Test logout endpoint"""
        return self.run_test(
            "Logout Endpoint",
            "POST",
            "api/auth/logout",
            200
        )

def main():
    print("🚀 Starting Centralita Virtual Auth API Tests")
    print("=" * 60)
    
    tester = AuthAPITester()
    
    # Run all tests in order
    test_methods = [
        tester.test_tenant_info,
        tester.test_admin_login,
        tester.test_user_login,
        tester.test_invalid_login,
        tester.test_wrong_tenant_login,
        tester.test_auth_me_admin,
        tester.test_auth_me_user,
        tester.test_auth_me_no_token,
        tester.test_kpis_endpoint,
        tester.test_kpis_no_auth,
        tester.test_llamadas_endpoint,
        tester.test_incidencias_endpoint,
        tester.test_comunicados_endpoint,
        tester.test_chart_data_endpoint,
        tester.test_create_incidencia,
        tester.test_logout_endpoint
    ]
    
    for test_method in test_methods:
        try:
            test_method()
        except Exception as e:
            print(f"❌ Test {test_method.__name__} failed with exception: {e}")
    
    # Print summary
    print("\n" + "=" * 60)
    print(f"📊 Test Summary:")
    print(f"   Tests run: {tester.tests_run}")
    print(f"   Tests passed: {tester.tests_passed}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())