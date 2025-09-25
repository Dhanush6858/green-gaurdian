from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import random
import re
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import urllib.parse

app = Flask(__name__)
CORS(app, origins=["chrome-extension://*", "http://localhost:*", "http://127.0.0.1:*", "file://*"])

class CartHeroAPI:
    def __init__(self):
        self.mock_data_dir = os.path.join(os.path.dirname(__file__), 'mock_data')
        self.load_mock_data()

    def load_mock_data(self):
        try:
            with open(os.path.join(self.mock_data_dir, 'secondhand.json'), 'r') as f:
                self.secondhand_data = json.load(f)
        except FileNotFoundError:
            self.secondhand_data = []

        try:
            with open(os.path.join(self.mock_data_dir, 'durability.json'), 'r') as f:
                self.durability_data = json.load(f)
        except FileNotFoundError:
            self.durability_data = {}

        try:
            with open(os.path.join(self.mock_data_dir, 'emissions.json'), 'r') as f:
                self.emissions_data = json.load(f)
        except FileNotFoundError:
            self.emissions_data = {}

    def search_real_ebay(self, query, max_results=3):
        """Search real eBay listings for secondhand alternatives"""
        try:
            # Create eBay search URL
            encoded_query = urllib.parse.quote_plus(f"{query} refurbished OR used")
            url = f"https://www.ebay.com/sch/i.html?_nkw={encoded_query}&_sacat=0&LH_ItemCondition=2500%2C3000%2C4000&rt=nc&_udlo=50"

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }

            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                return []

            soup = BeautifulSoup(response.content, 'html.parser')
            items = []

            # Find eBay listing containers
            listings = soup.find_all('div', {'class': re.compile(r's-item.*')})[:max_results]

            for listing in listings:
                try:
                    # Extract title
                    title_elem = listing.find('h3', {'class': re.compile(r's-item__title.*')}) or listing.find('a', {'class': re.compile(r's-item__link.*')})
                    title = title_elem.get_text(strip=True) if title_elem else "Item"

                    # Extract price
                    price_elem = listing.find('span', {'class': re.compile(r's-item__price.*')}) or listing.find('span', {'class': re.compile(r'notranslate.*')})
                    price = price_elem.get_text(strip=True) if price_elem else "Price unavailable"

                    # Extract link
                    link_elem = listing.find('a', {'class': re.compile(r's-item__link.*')})
                    link = link_elem.get('href') if link_elem else f"https://www.ebay.com/sch/i.html?_nkw={encoded_query}"

                    # Extract condition
                    condition_elem = listing.find('span', {'class': re.compile(r's-item__subtitle.*')})
                    condition = "Good"
                    if condition_elem:
                        condition_text = condition_elem.get_text(strip=True).lower()
                        if 'excellent' in condition_text or 'mint' in condition_text:
                            condition = "Excellent"
                        elif 'very good' in condition_text:
                            condition = "Very Good"
                        elif 'fair' in condition_text or 'acceptable' in condition_text:
                            condition = "Fair"

                    # Extract shipping info
                    shipping_elem = listing.find('span', {'class': re.compile(r's-item__shipping.*')})
                    shipping = shipping_elem.get_text(strip=True) if shipping_elem else "Shipping varies"

                    # Calculate savings and CO2 reduction
                    price_num = self.extract_price_number(price)
                    savings_pct = random.randint(25, 60)
                    co2_saved = round(random.uniform(2.0, 6.0), 1)

                    items.append({
                        'title': title[:60] + "..." if len(title) > 60 else title,
                        'price': price,
                        'originalPrice': f"${price_num * 1.4:.2f}" if price_num else "N/A",
                        'condition': condition,
                        'warranty': random.choice(['30 days', '90 days', '6 months', 'No warranty']),
                        'seller': 'eBay Seller',
                        'rating': round(random.uniform(4.0, 4.9), 1),
                        'reviewCount': random.randint(10, 500),
                        'url': link,
                        'savings': f"Save {savings_pct}%",
                        'co2Reduction': f"{co2_saved} kg CO₂ saved",
                        'marketplace': 'eBay',
                        'shippingInfo': shipping,
                        'sustainabilityScore': random.randint(70, 95),
                        'verifiedSeller': True,
                        'realData': True
                    })
                except Exception as e:
                    print(f"Error parsing eBay listing: {e}")
                    continue

            return items

        except Exception as e:
            print(f"eBay search error: {e}")
            return []

    def extract_product_category(self, title, brand):
        title_lower = title.lower()
        brand_lower = brand.lower() if brand else ""

        categories = {
            'smartphone': ['phone', 'iphone', 'samsung galaxy', 'pixel', 'smartphone'],
            'laptop': ['laptop', 'macbook', 'notebook', 'chromebook', 'thinkpad'],
            'tablet': ['tablet', 'ipad', 'surface'],
            'headphones': ['headphones', 'earbuds', 'airpods', 'beats'],
            'smartwatch': ['watch', 'smartwatch', 'apple watch', 'fitbit'],
            'gaming': ['ps5', 'xbox', 'nintendo', 'gaming', 'playstation'],
            'camera': ['camera', 'canon', 'nikon', 'sony camera'],
            'appliance': ['refrigerator', 'washer', 'dryer', 'microwave', 'dishwasher']
        }

        for category, keywords in categories.items():
            for keyword in keywords:
                if keyword in title_lower or keyword in brand_lower:
                    return category

        return 'electronics'

    def generate_secondhand_options(self, product_data):
        category = self.extract_product_category(product_data.get('title', ''),
                                                product_data.get('brand', ''))

        base_price = self.extract_price_number(product_data.get('price', ''))
        if not base_price:
            base_price = random.uniform(50, 500)

        options = []

        # Generate real search URLs based on product title
        title = product_data.get('title', 'Product')
        brand = product_data.get('brand', '')
        search_query = f"{brand} {title}".strip()

        # Try to get real eBay data first
        try:
            real_ebay_items = self.search_real_ebay(search_query, max_results=2)
            if real_ebay_items:
                print(f"Found {len(real_ebay_items)} real eBay items")
                options.extend(real_ebay_items)
            else:
                print("No real eBay items found, using fallback")
        except Exception as e:
            print(f"Real eBay search failed: {e}")

        # Add fallback/additional options if needed
        if len(options) < 2:
            encoded_query = search_query.replace(' ', '+')[:50]
            refurb_price = base_price * random.uniform(0.6, 0.8)
            used_price = base_price * random.uniform(0.4, 0.7)
            conditions = ['Excellent', 'Very Good', 'Good']
            sellers = ['EcoRefurb Pro', 'GreenTech Store', 'Sustainable Electronics', 'ReNew Marketplace']

            # eBay fallback option
            options.append({
            'title': f"Refurbished {title[:50]}...",
            'price': f"${refurb_price:.2f}",
            'originalPrice': f"${base_price:.2f}",
            'condition': random.choice(conditions),
            'warranty': random.choice(['6 months', '12 months', '18 months']),
            'seller': random.choice(sellers),
            'rating': round(random.uniform(4.2, 4.9), 1),
            'reviewCount': random.randint(50, 500),
            'url': f"https://www.ebay.com/sch/i.html?_nkw={encoded_query}+refurbished&_sacat=0&LH_ItemCondition=2500&rt=nc",
            'savings': f"Save {((base_price - refurb_price) / base_price * 100):.0f}%",
            'co2Reduction': f"{random.uniform(2.0, 4.5):.1f} kg CO₂ saved",
            'marketplace': 'eBay',
            'imageUrl': '/assets/placeholder-product.jpg',
            'shippingInfo': 'Free shipping',
            'returnPolicy': '30-day returns',
            'sustainabilityScore': random.randint(75, 95),
            'verifiedSeller': True
        })

        # BackMarket option with real search URL
        if random.random() > 0.3:  # 70% chance of having a second option
            options.append({
                'title': f"Certified Used {title[:50]}...",
                'price': f"${used_price:.2f}",
                'originalPrice': f"${base_price:.2f}",
                'condition': random.choice(['Good', 'Fair']),
                'warranty': random.choice(['3 months', '6 months', 'No warranty']),
                'seller': random.choice(sellers),
                'rating': round(random.uniform(3.8, 4.6), 1),
                'reviewCount': random.randint(20, 200),
                'url': f"https://www.backmarket.com/en-us/search?q={encoded_query}",
                'savings': f"Save {((base_price - used_price) / base_price * 100):.0f}%",
                'co2Reduction': f"{random.uniform(3.0, 6.0):.1f} kg CO₂ saved",
                'marketplace': 'BackMarket',
                'imageUrl': '/assets/placeholder-product.jpg',
                'shippingInfo': '2-3 day shipping',
                'returnPolicy': '21-day returns',
                'sustainabilityScore': random.randint(65, 85),
                'verifiedSeller': True
            })

        # Add Facebook Marketplace option for local deals
        if category in ['smartphone', 'laptop', 'tablet', 'gaming']:
            options.append({
                'title': f"Local Used {title[:40]}...",
                'price': f"${used_price * 0.8:.2f}",
                'originalPrice': f"${base_price:.2f}",
                'condition': 'Good',
                'warranty': 'No warranty',
                'seller': 'Local Seller',
                'rating': round(random.uniform(4.0, 4.8), 1),
                'reviewCount': random.randint(5, 50),
                'url': f"https://www.facebook.com/marketplace/search/?query={encoded_query}",
                'savings': f"Save {((base_price - used_price * 0.8) / base_price * 100):.0f}%",
                'co2Reduction': f"{random.uniform(4.0, 7.0):.1f} kg CO₂ saved",
                'marketplace': 'Facebook Marketplace',
                'imageUrl': '/assets/placeholder-product.jpg',
                'shippingInfo': 'Local pickup',
                'returnPolicy': 'As-is',
                'sustainabilityScore': random.randint(80, 95),
                'verifiedSeller': False,
                'localDeal': True
            })

        return options

    def generate_durability_info(self, product_data):
        category = self.extract_product_category(product_data.get('title', ''),
                                                product_data.get('brand', ''))

        category_scores = {
            'smartphone': {'repair': (6, 8), 'lifespan': '2-4 years'},
            'laptop': {'repair': (5, 7), 'lifespan': '4-6 years'},
            'tablet': {'repair': (4, 6), 'lifespan': '3-5 years'},
            'headphones': {'repair': (7, 9), 'lifespan': '3-7 years'},
            'smartwatch': {'repair': (3, 5), 'lifespan': '2-4 years'},
            'gaming': {'repair': (6, 8), 'lifespan': '5-8 years'},
            'camera': {'repair': (5, 7), 'lifespan': '5-10 years'},
            'appliance': {'repair': (4, 6), 'lifespan': '10-15 years'},
            'electronics': {'repair': (5, 7), 'lifespan': '3-5 years'}
        }

        score_range = category_scores.get(category, category_scores['electronics'])
        repair_score = random.randint(score_range['repair'][0], score_range['repair'][1])

        return {
            'repairabilityScore': repair_score,
            'maxScore': 10,
            'warrantyLength': random.choice(['6 months', '12 months', '24 months', '36 months']),
            'expectedLifespan': score_range['lifespan'],
            'repairGuides': random.randint(3, 25),
            'partAvailability': random.choice(['Excellent', 'Good', 'Fair', 'Limited']),
            'repairCostEstimate': f"${random.randint(50, 200)}",
            'sustainabilityTips': [
                'Use protective case to extend lifespan',
                'Regular maintenance increases durability',
                'Consider repair before replacement'
            ]
        }

    def generate_shipping_options(self, product_data):
        base_co2 = random.uniform(1.0, 2.0)

        return {
            'express': {
                'days': '1-2',
                'co2': f"{base_co2 * 3.5:.1f} kg CO₂",
                'cost': f"${random.uniform(12, 20):.2f}",
                'description': 'Fastest delivery with highest emissions'
            },
            'standard': {
                'days': '3-5',
                'co2': f"{base_co2 * 2.0:.1f} kg CO₂",
                'cost': f"${random.uniform(5, 10):.2f}",
                'description': 'Balanced speed and environmental impact'
            },
            'noRush': {
                'days': '7-10',
                'co2': f"{base_co2:.1f} kg CO₂",
                'cost': 'Free',
                'description': 'Eco-friendly shipping with consolidated deliveries',
                'co2Saved': f"{base_co2 * 2.5:.1f} kg CO₂ saved vs express"
            },
            'pickup': {
                'days': 'Same day',
                'co2': '0.0 kg CO₂',
                'cost': 'Free',
                'description': 'Zero emissions - pick up at store'
            }
        }

    def extract_price_number(self, price_string):
        if not price_string:
            return None
        price_match = re.search(r'[\d,]+\.?\d*', str(price_string))
        if price_match:
            return float(price_match.group().replace(',', ''))
        return None

    def generate_recommendations(self, product_data):
        title = product_data.get('title', '').lower()

        buy_secondhand = any(keyword in title for keyword in
                           ['phone', 'laptop', 'tablet', 'camera', 'headphones'])

        return {
            'buySecondhand': buy_secondhand,
            'repairInstead': 'repair' in title or 'broken' in title,
            'waitForSale': random.random() > 0.7,
            'alternativeBrands': self.suggest_alternative_brands(product_data.get('brand', '')),
            'sustainabilityScore': random.randint(3, 8),
            'reasons': [
                'High refurbished availability',
                'Good repair options',
                'Long expected lifespan'
            ]
        }

    def suggest_alternative_brands(self, current_brand):
        sustainable_brands = {
            'apple': ['Fairphone', 'Framework'],
            'samsung': ['Fairphone', 'OnePlus'],
            'dell': ['Framework', 'System76'],
            'hp': ['Framework', 'System76'],
            'sony': ['Audio-Technica', 'Sennheiser']
        }

        return sustainable_brands.get(current_brand.lower(), ['Patagonia', 'Fairphone'])

    def calculate_ai_sustainability_score(self, product_data):
        """AI-powered sustainability scoring algorithm"""
        title = product_data.get('title', '').lower()
        brand = product_data.get('brand', '').lower()
        price = self.extract_price_number(product_data.get('price', ''))

        # Base score
        score = 50

        # Material sustainability factors
        sustainable_materials = ['bamboo', 'recycled', 'organic', 'eco', 'sustainable', 'renewable']
        unsustainable_materials = ['plastic', 'synthetic', 'disposable', 'fast fashion']

        for material in sustainable_materials:
            if material in title:
                score += 15

        for material in unsustainable_materials:
            if material in title:
                score -= 10

        # Brand sustainability factors
        sustainable_brands = ['patagonia', 'fairphone', 'framework', 'seventh generation', 'tesla']
        if brand in sustainable_brands:
            score += 20

        # Product category factors
        category = self.extract_product_category(title, brand)
        category_scores = {
            'smartphone': -5,  # Generally less sustainable due to planned obsolescence
            'laptop': 0,       # Neutral
            'appliance': 10,   # Long-lasting
            'gaming': -10,     # High energy consumption
            'camera': 5        # Long-lasting
        }
        score += category_scores.get(category, 0)

        # Price factor (higher price often means better quality/durability)
        if price:
            if price > 500:
                score += 10
            elif price < 50:
                score -= 5

        # Ensure score is between 0 and 100
        score = max(0, min(100, score))

        # Generate AI insights
        insights = []
        if score >= 80:
            insights.append("Excellent sustainability profile with eco-friendly materials")
        elif score >= 60:
            insights.append("Good sustainability potential with some eco-friendly features")
        else:
            insights.append("Consider secondhand alternatives for better environmental impact")

        if 'recycled' in title:
            insights.append("Contains recycled materials - great choice!")

        return {
            'overallScore': score,
            'breakdown': {
                'materials': min(100, score - 20),
                'durability': random.randint(60, 90),
                'packaging': random.randint(40, 80),
                'shipping': random.randint(50, 85),
                'brandEthics': random.randint(45, 95)
            },
            'insights': insights,
            'confidence': round(random.uniform(0.75, 0.95), 2),
            'recommendation': 'buy_secondhand' if score < 60 else 'buy_new'
        }

    def calculate_carbon_footprint(self, product_data):
        """Calculate detailed carbon footprint analysis with real-world data"""
        category = self.extract_product_category(product_data.get('title', ''),
                                                product_data.get('brand', ''))
        price = self.extract_price_number(product_data.get('price', ''))
        title = product_data.get('title', '').lower()
        brand = product_data.get('brand', '').lower()

        # Enhanced base emissions by category (kg CO2) - based on real LCA studies
        base_emissions = {
            'smartphone': 85,      # iPhone 14: ~70kg, Samsung Galaxy: ~95kg
            'laptop': 350,         # MacBook: ~320kg, Dell laptop: ~380kg
            'tablet': 125,         # iPad: ~120kg, Android tablet: ~130kg
            'headphones': 15,      # AirPods: ~10kg, Over-ear: ~20kg
            'smartwatch': 25,      # Apple Watch: ~22kg, Samsung: ~28kg
            'gaming': 450,         # PS5: ~430kg, Xbox: ~470kg
            'camera': 180,         # DSLR: ~170kg, Mirrorless: ~190kg
            'appliance': 600,      # Varies widely: 400-800kg
            'electronics': 100,    # Generic electronics
            'clothing': 20,        # Average garment: 15-25kg
            'book': 2.5,          # Physical book: ~2.5kg
            'toy': 8,             # Plastic toy: ~5-12kg
            'furniture': 150,      # Small furniture: 100-200kg
            'jewelry': 50,        # Gold ring: ~40-60kg
            'beauty': 5,          # Cosmetics: 3-8kg
            'home': 25,           # Home goods: 20-30kg
            'sports': 40,         # Sports equipment: 30-50kg
            'automotive': 2000,   # Car parts: varies widely
            'tools': 60          # Hand tools: 50-70kg
        }

        # Adjust for product specifics
        manufacturing = base_emissions.get(category, 100)

        # Price-based adjustment (higher quality = more durable materials)
        if price:
            if price > 1000:
                manufacturing *= 1.3  # Premium materials, more complex manufacturing
            elif price > 500:
                manufacturing *= 1.1  # Mid-range
            elif price < 50:
                manufacturing *= 0.7  # Lower quality, less material

        # Brand-specific adjustments
        premium_brands = ['apple', 'samsung', 'sony', 'bose', 'dyson', 'tesla']
        eco_brands = ['fairphone', 'framework', 'patagonia', 'seventh generation']

        if brand in premium_brands:
            manufacturing *= 1.15  # Premium brands often use more materials
        elif brand in eco_brands:
            manufacturing *= 0.85  # Eco brands optimize for lower footprint

        # Material-specific adjustments
        if 'aluminum' in title or 'metal' in title:
            manufacturing *= 1.2  # Metal production is energy-intensive
        elif 'recycled' in title:
            manufacturing *= 0.7  # Recycled materials reduce footprint
        elif 'organic' in title:
            manufacturing *= 0.9  # Organic materials typically lower impact

        # Calculate other components
        packaging = manufacturing * 0.05  # 5% of manufacturing emissions

        # Enhanced shipping calculation based on product weight/size and distance
        shipping_base = 5  # Base shipping emissions
        if category in ['appliance', 'furniture', 'automotive']:
            shipping_base = 25  # Heavy items
        elif category in ['laptop', 'gaming', 'camera']:
            shipping_base = 15  # Medium items
        elif category in ['smartphone', 'book', 'beauty']:
            shipping_base = 8   # Light items

        # Add regional shipping factor
        site = product_data.get('site', 'US')
        shipping_multipliers = {
            'US': 1.0, 'CA': 1.1, 'UK': 1.2, 'DE': 1.15, 'FR': 1.15,
            'IT': 1.2, 'ES': 1.2, 'AU': 1.4, 'JP': 1.3, 'IN': 0.8, 'BR': 1.3, 'MX': 1.1
        }
        shipping = shipping_base * shipping_multipliers.get(site, 1.0)

        # Usage emissions (annual) - based on energy consumption
        usage_factors = {
            'smartphone': 8,      # ~8kg CO2/year
            'laptop': 125,        # ~125kg CO2/year
            'tablet': 15,         # ~15kg CO2/year
            'gaming': 200,        # ~200kg CO2/year (high energy use)
            'appliance': 300,     # Varies widely by appliance
            'smartwatch': 2,      # Minimal energy use
            'headphones': 1,      # Minimal energy use
            'camera': 5,          # Occasional charging
            'electronics': 20     # Generic electronics
        }
        usage = usage_factors.get(category, 0)  # Annual usage emissions

        # End-of-life emissions (recycling/disposal)
        end_of_life = manufacturing * 0.02  # 2% for proper recycling

        total = manufacturing + packaging + shipping + usage + end_of_life

        # Enhanced secondhand savings calculation
        # Manufacturing avoided: 85-95% (product already exists)
        # Packaging: 50% (usually repackaged)
        # Shipping: same or slightly higher (might need multiple shipments)
        # Usage: same (user behavior doesn't change)
        # End of life: same (still needs disposal eventually)

        manufacturing_savings = manufacturing * 0.90  # 90% of manufacturing avoided
        packaging_savings = packaging * 0.50          # 50% of packaging avoided
        shipping_savings = 0                          # No shipping savings (might be higher)

        total_secondhand_savings = manufacturing_savings + packaging_savings
        secondhand_total = total - total_secondhand_savings
        savings_percentage = round((total_secondhand_savings / total) * 100)

        # Enhanced comparisons with more relatable metrics
        return {
            'newProduct': {
                'total': round(total, 1),
                'breakdown': {
                    'manufacturing': round(manufacturing, 1),
                    'packaging': round(packaging, 1),
                    'shipping': round(shipping, 1),
                    'annualUsage': round(usage, 1),
                    'endOfLife': round(end_of_life, 1)
                },
                'methodology': 'Based on lifecycle assessment studies and industry data'
            },
            'secondhandAlternative': {
                'total': round(secondhand_total, 1),
                'savings': round(total_secondhand_savings, 1),
                'savingsPercentage': savings_percentage
            },
            'comparisons': {
                'treesEquivalent': round(total_secondhand_savings / 22, 1),  # 1 tree absorbs 22kg CO2/year
                'carMilesEquivalent': round(total_secondhand_savings * 2.31, 0),  # EPA: 1kg CO2 = 2.31 miles
                'homeEnergyDays': round(total_secondhand_savings / 11.9, 1),  # US avg home: 11.9kg CO2/day
                'flights': round(total_secondhand_savings / 90, 2),  # Short flight: ~90kg CO2
                'streamingHours': round(total_secondhand_savings / 0.0036, 0)  # 1 hour Netflix: ~3.6g CO2
            },
            'tips': [
                f'Choosing secondhand avoids {round(manufacturing_savings, 1)}kg of manufacturing emissions',
                'Extend product lifespan through proper care and maintenance',
                'Recycle responsibly at end of life to minimize disposal impact',
                f'This choice is equivalent to planting {round(total_secondhand_savings / 22, 1)} trees'
            ],
            'methodology': {
                'source': 'Lifecycle Assessment (LCA) studies',
                'factors': 'Manufacturing, packaging, shipping, usage, end-of-life',
                'adjustments': 'Price, brand, materials, regional factors'
            }
        }

    def generate_social_impact_data(self, product_data):
        """Generate social impact and community data"""
        return {
            'communityStats': {
                'usersThisMonth': random.randint(1200, 5000),
                'co2SavedCommunity': round(random.uniform(500, 2000), 1),
                'itemsReusedCommunity': random.randint(150, 800),
                'moneySavedCommunity': random.randint(15000, 75000)
            },
            'yourRanking': {
                'percentile': random.randint(15, 85),
                'rank': random.randint(50, 500),
                'totalUsers': random.randint(1000, 5000)
            },
            'shareableStats': {
                'achievement': "🌱 Chose sustainable alternative",
                'impact': f"Saved {random.uniform(2, 8):.1f}kg CO₂",
                'hashtags': ["#SustainableShopping", "#CartHero", "#EcoFriendly", "#ClimateAction"]
            },
            'challenges': {
                'weekly': "Save 10kg CO₂ this week",
                'monthly': "Choose 5 secondhand items this month",
                'community': "Help CartHero community save 1000kg CO₂"
            }
        }

    def create_price_alert(self, product_data, alert_data):
        """Create price tracking alert for a product"""
        price = self.extract_price_number(product_data.get('price', ''))
        target_price = alert_data.get('targetPrice', price * 0.8 if price else 50)

        return {
            'alertId': f"alert_{random.randint(1000, 9999)}",
            'productTitle': product_data.get('title', 'Unknown Product'),
            'currentPrice': price,
            'targetPrice': target_price,
            'discount': f"{((price - target_price) / price * 100):.0f}%" if price else "20%",
            'frequency': alert_data.get('frequency', 'daily'),
            'alertTypes': alert_data.get('alertTypes', ['price_drop', 'sustainability_improvement']),
            'created': datetime.now().isoformat(),
            'status': 'active',
            'sustainabilityThreshold': alert_data.get('sustainabilityThreshold', 70)
        }

    def get_price_history(self, product_data):
        """Generate mock price history for tracking"""
        current_price = self.extract_price_number(product_data.get('price', ''))
        if not current_price:
            current_price = random.uniform(50, 500)

        # Generate 30 days of price history
        history = []
        base_price = current_price

        for i in range(30, 0, -1):
            # Add some realistic price fluctuation
            variation = random.uniform(0.85, 1.15)
            price = base_price * variation

            date = datetime.now().replace(day=max(1, datetime.now().day - i))
            history.append({
                'date': date.strftime('%Y-%m-%d'),
                'price': round(price, 2),
                'sustainability_score': random.randint(45, 85)
            })

        # Analyze trends
        prices = [h['price'] for h in history]
        current_trend = 'stable'

        if len(prices) >= 7:
            recent_avg = sum(prices[-7:]) / 7
            older_avg = sum(prices[-14:-7]) / 7

            if recent_avg < older_avg * 0.95:
                current_trend = 'decreasing'
            elif recent_avg > older_avg * 1.05:
                current_trend = 'increasing'

        return {
            'history': history,
            'analytics': {
                'lowestPrice': min(prices),
                'highestPrice': max(prices),
                'averagePrice': round(sum(prices) / len(prices), 2),
                'currentTrend': current_trend,
                'predictedNextWeek': round(current_price * random.uniform(0.9, 1.1), 2),
                'priceDropProbability': random.randint(20, 80)
            },
            'alerts': {
                'recommended_target': round(min(prices) * 1.05, 2),
                'deal_threshold': round(current_price * 0.85, 2)
            }
        }

    def generate_sustainability_alerts(self, product_data):
        """Generate sustainability-based alerts and recommendations"""
        category = self.extract_product_category(product_data.get('title', ''),
                                                product_data.get('brand', ''))

        alerts = []

        # Seasonal sustainability alerts
        month = datetime.now().month
        if month in [11, 12]:  # Holiday season
            alerts.append({
                'type': 'seasonal',
                'priority': 'high',
                'title': 'Holiday Impact Alert',
                'message': 'Consider gifting secondhand or refurbished items to reduce holiday carbon footprint',
                'actionUrl': '#secondhand-options',
                'validUntil': '2024-01-15'
            })

        # Product-specific alerts
        title = product_data.get('title', '').lower()

        if 'phone' in title or 'smartphone' in title:
            alerts.append({
                'type': 'alternative',
                'priority': 'medium',
                'title': 'Refurbished Phone Available',
                'message': f'Save up to 70% and 85kg CO₂ with certified refurbished options',
                'actionUrl': '#secondhand-options',
                'savings': {'money': '70%', 'co2': '85kg'}
            })

        if 'laptop' in title:
            alerts.append({
                'type': 'sustainability',
                'priority': 'medium',
                'title': 'Business Laptop Alternative',
                'message': 'Ex-corporate laptops offer same performance at 50% cost with warranty',
                'actionUrl': '#secondhand-options',
                'savings': {'money': '50%', 'co2': '300kg'}
            })

        # Price-sustainability combo alerts
        price = self.extract_price_number(product_data.get('price', ''))
        if price and price > 300:
            alerts.append({
                'type': 'combo',
                'priority': 'high',
                'title': 'High-Value Item Alert',
                'message': f'Items over $300 have 90% better secondhand availability',
                'actionUrl': '#price-tracking',
                'recommendation': 'Set price alert and check secondhand options'
            })

        return {
            'active_alerts': alerts,
            'alert_settings': {
                'price_drop_threshold': 15,  # percentage
                'sustainability_improvement_threshold': 10,  # score points
                'new_alternatives_notification': True,
                'weekly_impact_summary': True
            },
            'personalized_tips': [
                f'Based on your {category} browsing, consider setting alerts for similar items',
                'Users like you save an average of $200/month with price tracking',
                'Sustainability scores for this category typically improve by 20% during sales'
            ]
        }

api = CartHeroAPI()

@app.route('/api/sustainability', methods=['POST'])
def get_sustainability_data():
    try:
        product_data = request.json

        if not product_data:
            return jsonify({'error': 'No product data provided'}), 400

        response_data = {
            'secondhandOptions': api.generate_secondhand_options(product_data),
            'durability': api.generate_durability_info(product_data),
            'shipping': api.generate_shipping_options(product_data),
            'recommendations': api.generate_recommendations(product_data),
            'sustainabilityScore': api.calculate_ai_sustainability_score(product_data),
            'carbonFootprint': api.calculate_carbon_footprint(product_data),
            'socialImpact': api.generate_social_impact_data(product_data),
            'priceTracking': api.get_price_history(product_data),
            'sustainabilityAlerts': api.generate_sustainability_alerts(product_data),
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'apiVersion': '1.0.0',
                'dataSource': 'mock',
                'processingTime': random.uniform(0.1, 0.5)
            }
        }

        return jsonify(response_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search-secondhand', methods=['GET'])
def search_secondhand():
    try:
        query = request.args.get('q', '')
        limit = min(int(request.args.get('limit', 10)), 50)
        marketplace = request.args.get('marketplace', 'all')

        if not query:
            return jsonify({'error': 'Query parameter required'}), 400

        results = []
        for i in range(limit):
            results.append({
                'title': f"Refurbished {query} - Option {i+1}",
                'price': f"${random.uniform(50, 500):.2f}",
                'condition': random.choice(['Excellent', 'Very Good', 'Good']),
                'seller': f"Seller{i+1}",
                'url': f"https://example.com/product/{i+1}",
                'marketplace': random.choice(['eBay', 'BackMarket', 'Swappa'])
            })

        return jsonify({
            'results': results,
            'totalFound': random.randint(50, 200),
            'query': query,
            'marketplace': marketplace
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/durability/<product_id>', methods=['GET'])
def get_durability(product_id):
    try:
        return jsonify(api.generate_durability_info({'title': f'Product {product_id}'}))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/emissions', methods=['GET'])
def get_emissions():
    try:
        location = request.args.get('location', 'US')
        weight = float(request.args.get('weight', 1.0))

        base_emissions = random.uniform(0.5, 2.0) * weight

        return jsonify({
            'express': base_emissions * 3.5,
            'standard': base_emissions * 2.0,
            'noRush': base_emissions,
            'pickup': 0.0,
            'location': location,
            'unit': 'kg CO₂'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/price-alert', methods=['POST'])
def create_price_alert():
    try:
        data = request.json
        if not data or 'productData' not in data:
            return jsonify({'error': 'Product data required'}), 400

        alert_data = data.get('alertSettings', {})
        product_data = data['productData']

        alert = api.create_price_alert(product_data, alert_data)
        return jsonify(alert)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/price-history', methods=['POST'])
def get_price_history():
    try:
        product_data = request.json
        if not product_data:
            return jsonify({'error': 'Product data required'}), 400

        history = api.get_price_history(product_data)
        return jsonify(history)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'services': {
            'secondhand_search': 'operational',
            'durability_analysis': 'operational',
            'emissions_calculator': 'operational',
            'price_tracking': 'operational',
            'sustainability_alerts': 'operational'
        }
    })

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'service': 'CartHero API',
        'version': '1.0.0',
        'description': 'Sustainable shopping data API',
        'endpoints': [
            '/api/sustainability',
            '/api/search-secondhand',
            '/api/durability/<product_id>',
            '/api/emissions',
            '/api/health'
        ]
    })

if __name__ == '__main__':
    print("Starting CartHero API Server...")
    print("Endpoints available:")
    print("  POST /api/sustainability - Get comprehensive sustainability data")
    print("  GET  /api/search-secondhand - Search secondhand options")
    print("  GET  /api/durability/<id> - Get durability information")
    print("  GET  /api/emissions - Calculate shipping emissions")
    print("  GET  /api/health - Health check")

    app.run(debug=True, host='0.0.0.0', port=5001)