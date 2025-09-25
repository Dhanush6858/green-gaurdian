
"""
CartHero API Testing Script
Run this to verify all backend endpoints are working correctly
"""

import requests
import json
import time

BASE_URL = "http://localhost:5001"

def test_endpoint(method, endpoint, data=None, description=""):
    """Test a single API endpoint"""
    print(f"\n🧪 Testing: {description}")
    print(f"   {method} {endpoint}")

    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}")
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", json=data)

        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Success")
            return result
        else:
            print(f"   ❌ Failed: {response.text}")
            return None

    except requests.exceptions.ConnectionError:
        print(f"   ❌ Connection Failed - Is server running on {BASE_URL}?")
        return None
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return None

def main():
    print("🌱 CartHero API Test Suite")
    print("=" * 50)

    # Test 1: Health Check
    health = test_endpoint("GET", "/api/health", description="Health Check")

    # Test 2: Main Sustainability API
    product_data = {
        "title": "iPhone 15 Pro Max",
        "price": "$1199",
        "brand": "Apple",
        "url": "https://amazon.com/test"
    }

    sustainability = test_endpoint(
        "POST", "/api/sustainability",
        data=product_data,
        description="Sustainability Analysis"
    )

    if sustainability:
        print(f"   📊 AI Score: {sustainability.get('sustainabilityScore', {}).get('overallScore', 'N/A')}")
        print(f"   🔄 Alternatives: {len(sustainability.get('secondhandOptions', []))}")
        print(f"   💰 Price Tracking: {'✅' if 'priceTracking' in sustainability else '❌'}")
        print(f"   🚨 Alerts: {len(sustainability.get('sustainabilityAlerts', {}).get('active_alerts', []))}")

    # Test 3: Price Alert Creation
    alert_data = {
        "productData": product_data,
        "alertSettings": {
            "targetPrice": 999,
            "frequency": "daily",
            "alertTypes": ["price_drop", "sustainability_improvement"]
        }
    }

    alert = test_endpoint(
        "POST", "/api/price-alert",
        data=alert_data,
        description="Price Alert Creation"
    )

    if alert:
        print(f"   🎯 Alert ID: {alert.get('alertId', 'N/A')}")
        print(f"   💰 Target Price: ${alert.get('targetPrice', 'N/A')}")

    # Test 4: Price History
    history = test_endpoint(
        "POST", "/api/price-history",
        data=product_data,
        description="Price History Analysis"
    )

    if history:
        analytics = history.get('analytics', {})
        print(f"   📈 Trend: {analytics.get('currentTrend', 'N/A')}")
        print(f"   📉 Lowest Price: ${analytics.get('lowestPrice', 'N/A')}")
        print(f"   🎲 Drop Probability: {analytics.get('priceDropProbability', 'N/A')}%")

    # Test 5: Secondhand Search
    search = test_endpoint(
        "GET", "/api/search-secondhand?q=iPhone&limit=3",
        description="Secondhand Search"
    )

    if search:
        print(f"   🔍 Results: {len(search.get('results', []))}")
        print(f"   📊 Total Found: {search.get('totalFound', 'N/A')}")

    # Test 6: Emissions Calculator
    emissions = test_endpoint(
        "GET", "/api/emissions?weight=1.5&location=US",
        description="Emissions Calculator"
    )

    if emissions:
        print(f"   🚚 Express: {emissions.get('express', 'N/A')} kg CO₂")
        print(f"   🌱 No Rush: {emissions.get('noRush', 'N/A')} kg CO₂")

    print("\n" + "=" * 50)
    print("🏁 Test Suite Complete!")
    print("\nNext Steps:")
    print("1. If all tests passed, your backend is ready! ✅")
    print("2. Load the extension in Chrome to test frontend")
    print("3. Visit any Amazon product page to see CartHero in action")
    print("4. Check the TESTING_GUIDE.md for detailed feature testing")

if __name__ == "__main__":
    main()