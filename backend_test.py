#!/usr/bin/env python3
"""
Backend API Testing for Santa Gadea Chatbot
Tests the /api/onyx-chat endpoint with mock fallback functionality
"""

import requests
import sys
import json
from datetime import datetime

class ChatbotAPITester:
    def __init__(self, base_url="https://switchboard-pro-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def run_test(self, name, method, endpoint, expected_status, data=None, check_response=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            
            success = response.status_code == expected_status
            
            if success:
                print(f"✅ Status Code: {response.status_code} ✓")
                
                # Additional response checks
                if check_response and response.status_code == 200:
                    try:
                        response_data = response.json()
                        if check_response(response_data):
                            print(f"✅ Response validation: ✓")
                            self.tests_passed += 1
                        else:
                            print(f"❌ Response validation failed")
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

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        return self.run_test(
            "Basic API connectivity",
            "GET",
            "api/",
            200
        )

    def test_onyx_chat_fiestas(self):
        """Test chat API with fiestas query"""
        def check_fiestas_response(data):
            response = data.get('response', '').lower()
            return ('14' in response and '17' in response and 'agosto' in response and 
                   'fiestas' in response and 'santa gadea' in response)
        
        return self.run_test(
            "Onyx Chat - Fiestas query",
            "POST",
            "api/onyx-chat",
            200,
            data={
                "messages": [
                    {"role": "user", "content": "¿Cuándo son las fiestas patronales?"}
                ]
            },
            check_response=check_fiestas_response
        )

    def test_onyx_chat_horarios(self):
        """Test chat API with horarios query"""
        def check_horarios_response(data):
            response = data.get('response', '').lower()
            return ('horario' in response and 'ayuntamiento' in response and 
                   '9:00' in response and '14:00' in response)
        
        return self.run_test(
            "Onyx Chat - Horarios query",
            "POST",
            "api/onyx-chat",
            200,
            data={
                "messages": [
                    {"role": "user", "content": "¿Cuál es el horario del ayuntamiento?"}
                ]
            },
            check_response=check_horarios_response
        )

    def test_onyx_chat_piscina(self):
        """Test chat API with piscina query"""
        def check_piscina_response(data):
            response = data.get('response', '').lower()
            return ('piscina' in response and 'municipal' in response and 
                   ('3€' in response or '3 €' in response or 'adultos' in response))
        
        return self.run_test(
            "Onyx Chat - Piscina query",
            "POST",
            "api/onyx-chat",
            200,
            data={
                "messages": [
                    {"role": "user", "content": "Información sobre la piscina municipal"}
                ]
            },
            check_response=check_piscina_response
        )

    def test_onyx_chat_default(self):
        """Test chat API with general query"""
        def check_default_response(data):
            response = data.get('response', '').lower()
            return ('santa gadea' in response and 'ayuntamiento' in response and 
                   ('asistente' in response or 'hola' in response))
        
        return self.run_test(
            "Onyx Chat - Default response",
            "POST",
            "api/onyx-chat",
            200,
            data={
                "messages": [
                    {"role": "user", "content": "Hola, ¿qué puedes hacer?"}
                ]
            },
            check_response=check_default_response
        )

    def test_onyx_chat_conversation(self):
        """Test chat API with conversation context"""
        def check_conversation_response(data):
            response = data.get('response', '')
            return len(response) > 10 and 'santa gadea' in response.lower()
        
        return self.run_test(
            "Onyx Chat - Conversation context",
            "POST",
            "api/onyx-chat",
            200,
            data={
                "messages": [
                    {"role": "user", "content": "Hola"},
                    {"role": "assistant", "content": "¡Hola! Soy el asistente del Ayuntamiento de Santa Gadea del Cid"},
                    {"role": "user", "content": "¿Qué servicios ofrecéis?"}
                ]
            },
            check_response=check_conversation_response
        )

    def test_onyx_chat_invalid_request(self):
        """Test chat API with invalid request"""
        return self.run_test(
            "Onyx Chat - Invalid request",
            "POST",
            "api/onyx-chat",
            422,  # Validation error expected
            data={
                "invalid_field": "test"
            }
        )

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test POST status
        success, response = self.run_test(
            "Status Check - Create",
            "POST",
            "api/status",
            200,
            data={"client_name": "test_client"}
        )
        
        if success:
            # Test GET status
            self.run_test(
                "Status Check - List",
                "GET",
                "api/status",
                200
            )
        
        return success

def main():
    print("🚀 Starting Santa Gadea Chatbot API Tests")
    print("=" * 50)
    
    tester = ChatbotAPITester()
    
    # Run all tests
    test_methods = [
        tester.test_basic_connectivity,
        tester.test_onyx_chat_fiestas,
        tester.test_onyx_chat_horarios,
        tester.test_onyx_chat_piscina,
        tester.test_onyx_chat_default,
        tester.test_onyx_chat_conversation,
        tester.test_onyx_chat_invalid_request,
        tester.test_status_endpoints
    ]
    
    for test_method in test_methods:
        try:
            test_method()
        except Exception as e:
            print(f"❌ Test {test_method.__name__} failed with exception: {e}")
    
    # Print summary
    print("\n" + "=" * 50)
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