#!/usr/bin/env python3
"""
CartHero Extension Comprehensive Testing Script
Tests all features and functionality to ensure everything works dynamically.
"""

import requests
import json
import time
import sys
from datetime import datetime

class CartHeroTester:
    def __init__(self):
        self.api_base = "http://localhost:5001"
        self.test_results = []
        self.passed = 0
        self.failed = 0

    def log_test(self, test_name, passed, details=""):
        """Log test result"""
        status = "[PASS]" if passed else "[FAIL]"
        result = {
            'test': test_name,
            'status': status,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)

        if passed:
            self.passed += 1
        else:
            self.failed += 1

        print(f"{status}: {test_name}")
        if details and not passed:
            print(f"   Details: {details}")

    def test_api_health(self):
        """Test API health endpoint"""
        try:
            response = requests.get(f"{self.api_base}/api/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                all_services_operational = all(
                    service == "operational"
                    for service in data.get('services', {}).values()
                )
                self.log_test("API Health Check", all_services_operational,
                            f"Services: {data.get('services', {})}")
            else:
                self.log_test("API Health Check", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("API Health Check", False, str(e))

    def test_sustainability_api(self):
        """Test main sustainability API with various product types"""
        test_products = [
            {
                "name": "iPhone 15 Pro",
                "data": {
                    "title": "iPhone 15 Pro 128GB Natural Titanium",
                    "price": "$999",
                    "brand": "Apple",
                    "site": "US",
                    "category": "smartphone"
                }
            },
            {
                "name": "MacBook Pro",
                "data": {
                    "title": "MacBook Pro 16-inch M3 Pro",
                    "price": "$2399",
                    "brand": "Apple",
                    "site": "US",
                    "category": "laptop"
                }
            },
            {
                "name": "Sony Camera",
                "data": {
                    "title": "Sony Alpha a7 IV Mirrorless Camera",
                    "price": "$2498",
                    "brand": "Sony",
                    "site": "US",
                    "category": "camera"
                }
            }
        ]

        for product in test_products:
            try:
                response = requests.post(
                    f"{self.api_base}/api/sustainability",
                    json=product["data"],
                    headers={"Content-Type": "application/json"},
                    timeout=15
                )

                if response.status_code == 200:
                    data = response.json()

                    # Check required sections
                    required_sections = [
                        'sustainabilityScore', 'secondhandOptions', 'carbonFootprint',
                        'durability', 'shipping', 'socialImpact', 'priceTracking',
                        'sustainabilityAlerts'
                    ]

                    missing_sections = [
                        section for section in required_sections
                        if section not in data
                    ]

                    if not missing_sections:
                        # Validate data quality
                        valid_data = (
                            len(data.get('secondhandOptions', [])) >= 2 and
                            data.get('carbonFootprint', {}).get('newProduct', {}).get('total', 0) > 0 and
                            data.get('sustainabilityScore', {}).get('overallScore', 0) > 0
                        )

                        self.log_test(f"Sustainability API - {product['name']}", valid_data,
                                    f"Sections: {len(required_sections) - len(missing_sections)}/{len(required_sections)}")
                    else:
                        self.log_test(f"Sustainability API - {product['name']}", False,
                                    f"Missing: {missing_sections}")
                else:
                    self.log_test(f"Sustainability API - {product['name']}", False,
                                f"HTTP {response.status_code}: {response.text}")

            except Exception as e:
                self.log_test(f"Sustainability API - {product['name']}", False, str(e))

    def test_ebay_integration(self):
        """Test eBay search integration"""
        try:
            response = requests.post(
                f"{self.api_base}/api/sustainability",
                json={
                    "title": "iPad Pro 12.9-inch",
                    "price": "$1099",
                    "brand": "Apple",
                    "site": "US"
                },
                timeout=20  # eBay search might take longer
            )

            if response.status_code == 200:
                data = response.json()
                secondhand_options = data.get('secondhandOptions', [])

                # Check if we got real eBay data (marked with realData: true)
                real_ebay_items = [
                    item for item in secondhand_options
                    if item.get('realData') == True
                ]

                has_ebay_links = any(
                    'ebay.com' in item.get('url', '')
                    for item in secondhand_options
                )

                self.log_test("eBay Integration", has_ebay_links,
                            f"Found {len(real_ebay_items)} real eBay items, {len(secondhand_options)} total")
            else:
                self.log_test("eBay Integration", False, f"HTTP {response.status_code}")

        except Exception as e:
            self.log_test("eBay Integration", False, str(e))

    def test_carbon_calculations(self):
        """Test enhanced carbon footprint calculations"""
        try:
            response = requests.post(
                f"{self.api_base}/api/sustainability",
                json={
                    "title": "Tesla Model 3 Accessories",
                    "price": "$150",
                    "brand": "Tesla",
                    "site": "US"
                }
            )

            if response.status_code == 200:
                data = response.json()
                carbon_data = data.get('carbonFootprint', {})

                # Check enhanced calculations
                has_methodology = 'methodology' in carbon_data
                has_enhanced_comparisons = 'flights' in carbon_data.get('comparisons', {})
                has_realistic_savings = (
                    carbon_data.get('secondhandAlternative', {}).get('savingsPercentage', 0)
                    in range(50, 95)  # Realistic range
                )

                all_checks_passed = has_methodology and has_enhanced_comparisons and has_realistic_savings

                self.log_test("Enhanced Carbon Calculations", all_checks_passed,
                            f"Methodology: {has_methodology}, Enhanced comparisons: {has_enhanced_comparisons}, Realistic savings: {has_realistic_savings}")
            else:
                self.log_test("Enhanced Carbon Calculations", False, f"HTTP {response.status_code}")

        except Exception as e:
            self.log_test("Enhanced Carbon Calculations", False, str(e))

    def test_international_support(self):
        """Test international Amazon site support"""
        international_sites = [
            {"site": "UK", "currency": "£"},
            {"site": "DE", "currency": "€"},
            {"site": "CA", "currency": "CAD"},
            {"site": "AU", "currency": "AUD"}
        ]

        for site_info in international_sites:
            try:
                response = requests.post(
                    f"{self.api_base}/api/sustainability",
                    json={
                        "title": "Samsung Galaxy S24",
                        "price": f"{site_info['currency']}800",
                        "brand": "Samsung",
                        "site": site_info["site"]
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    # Check if shipping calculations consider regional factors
                    shipping_data = data.get('shipping', {})
                    has_shipping_options = len(shipping_data) >= 3

                    self.log_test(f"International Support - {site_info['site']}", has_shipping_options,
                                f"Shipping options: {list(shipping_data.keys())}")
                else:
                    self.log_test(f"International Support - {site_info['site']}", False,
                                f"HTTP {response.status_code}")

            except Exception as e:
                self.log_test(f"International Support - {site_info['site']}", False, str(e))

    def test_extension_files(self):
        """Test extension file structure and completeness"""
        import os

        base_path = "carthero-extension"
        required_files = [
            "manifest.json",
            "content.js",
            "user-system.js",
            "gamification.js",
            "popup.html",
            "popup.js",
            "overlay.css",
            "background.js"
        ]

        for file_name in required_files:
            file_path = os.path.join(base_path, file_name)
            exists = os.path.exists(file_path)

            if exists:
                # Check file size (should not be empty)
                size = os.path.getsize(file_path)
                self.log_test(f"Extension File - {file_name}", size > 100,
                            f"Size: {size} bytes")
            else:
                self.log_test(f"Extension File - {file_name}", False, "File not found")

    def test_user_system_structure(self):
        """Test user system data structure"""
        # This would ideally be tested in browser context, but we can validate the structure
        expected_user_structure = {
            "profile": ["level", "xp", "totalCO2Saved", "totalMoneySaved", "itemsReused", "streak"],
            "achievements": [],
            "statistics": ["dailyStats"],
            "preferences": ["sustainabilityGoals", "alertSettings"]
        }

        # Read user-system.js to check if all required methods exist
        try:
            with open("carthero-extension/user-system.js", 'r', encoding='utf-8') as f:
                content = f.read()

            required_methods = [
                "createUser", "loadUser", "saveUser", "addXP", "trackAction",
                "checkAchievements", "getDashboardData", "getProgressToNextLevel"
            ]

            missing_methods = [
                method for method in required_methods
                if f"async {method}" not in content and f"{method}(" not in content
            ]

            self.log_test("User System Structure", len(missing_methods) == 0,
                        f"Missing methods: {missing_methods}" if missing_methods else "All methods present")

        except Exception as e:
            self.log_test("User System Structure", False, str(e))

    def run_all_tests(self):
        """Run all tests and generate report"""
        print("Starting CartHero Extension Comprehensive Testing")
        print("=" * 60)

        # API Tests
        print("\n[API Tests]")
        print("-" * 30)
        self.test_api_health()
        self.test_sustainability_api()
        self.test_ebay_integration()
        self.test_carbon_calculations()
        self.test_international_support()

        # Extension Tests
        print("\n[Extension Tests]")
        print("-" * 30)
        self.test_extension_files()
        self.test_user_system_structure()

        # Generate Report
        print("\n" + "=" * 60)
        print("[TEST SUMMARY]")
        print("=" * 60)
        print(f"Total Tests: {self.passed + self.failed}")
        print(f"[PASS] Passed: {self.passed}")
        print(f"[FAIL] Failed: {self.failed}")
        print(f"Success Rate: {(self.passed / (self.passed + self.failed) * 100):.1f}%")

        if self.failed > 0:
            print(f"\n[FAILED TESTS]:")
            for result in self.test_results:
                if "FAIL" in result['status']:
                    print(f"   - {result['test']}: {result['details']}")

        print(f"\n[STATUS]: {'ALL SYSTEMS GO' if self.failed == 0 else 'ISSUES DETECTED'}")

        # Save detailed report
        with open('test_report.json', 'w') as f:
            json.dump({
                'summary': {
                    'total': self.passed + self.failed,
                    'passed': self.passed,
                    'failed': self.failed,
                    'success_rate': self.passed / (self.passed + self.failed) * 100
                },
                'results': self.test_results
            }, f, indent=2)

        print(f"[REPORT] Detailed report saved to: test_report.json")

        return self.failed == 0

def main():
    tester = CartHeroTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()