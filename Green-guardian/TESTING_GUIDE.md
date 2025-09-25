# CartHero - Complete Feature Testing Guide

## Prerequisites

1. **Start the Backend Server**:
   ```bash
   cd backend
   python app.py
   ```
   - Server should start on http://localhost:5001
   - Verify by visiting http://localhost:5001/api/health

2. **Load Extension in Chrome**:
   - Open Chrome → Extensions → Developer mode ON
   - Click "Load unpacked" → Select `carthero-extension` folder
   - Extension should appear in toolbar

## Testing Strategy

### 1. AI-Powered Sustainability Scoring

**What to Test**: AI analysis of products with sustainability breakdown

**Steps**:
1. Go to any Amazon product page (e.g., search "iPhone" on amazon.com)
2. Look for the CartHero overlay that appears
3. Find the "🤖 AI Sustainability Analysis" section

**Expected Results**:
- Circular score display (0-100) with color coding
- AI confidence percentage
- Breakdown bars for Materials, Durability, Brand Ethics
- AI-generated insights (💡 messages)

**What to Check**:
- Score changes based on product type
- Higher scores for eco-friendly keywords
- Confidence level appears realistic (75-95%)

### 2. Real Alternative Product Links

**What to Test**: Functional secondhand marketplace links

**Steps**:
1. On any product page, scroll to "🔄 Better Alternatives Found"
2. Click any "🛒 View on eBay" or "View on BackMarket" button
3. Verify links open real marketplace searches

**Expected Results**:
- eBay links open with product search query
- BackMarket links work for refurbished items
- Facebook Marketplace links for local deals
- Real savings percentages and CO₂ reduction data

**What to Check**:
- Links actually search for the product
- Different marketplace options appear
- Sustainability scores on alternatives

### 3. Carbon Footprint Calculator

**What to Test**: Detailed carbon impact analysis

**Steps**:
1. Look for "🌍 Carbon Footprint Analysis" section
2. Compare "New Product" vs "Secondhand Alternative"
3. Check the impact comparisons

**Expected Results**:
- Detailed breakdown: Manufacturing, Packaging, Shipping
- Clear savings calculation (usually 73% reduction)
- Real-world comparisons: trees, car miles, home energy days

**What to Check**:
- Numbers are realistic for product category
- Secondhand savings are significant
- Comparisons help understand impact scale

### 4. Price Tracking & Alerts

**What to Test**: Smart price monitoring system

**Steps**:
1. Find "💰 Price Tracking & Alerts" section
2. Check price trend indicator (📈📉➡️)
3. Click "🔔 Track This Price" button
4. Enter a target price or leave empty for auto-suggestion

**Expected Results**:
- 30-day price history analytics
- Trend analysis (increasing/decreasing/stable)
- Price drop probability percentage
- Alert creation confirmation

**What to Check**:
- Price trend makes sense
- Drop probability is reasonable (20-80%)
- Alert gets saved locally
- Recommended prices are logical

### 5. Sustainability Alerts

**What to Test**: Context-aware sustainability recommendations

**Steps**:
1. Look for "🚨 Sustainability Alerts" section
2. Check different alert types and priorities
3. Click "Take Action" buttons
4. Try "⚙️ Settings" button

**Expected Results**:
- Product-specific alerts (phones, laptops)
- Seasonal alerts (holiday shopping)
- High-value item recommendations
- Settings modal with customization options

**What to Check**:
- Alerts are relevant to the product
- Priority badges (HIGH) appear appropriately
- Action buttons navigate correctly
- Settings save properly

### 6. Social Impact & Community Features

**What to Test**: Community stats and sharing functionality

**Steps**:
1. Find "👥 Community Impact" section
2. Check community statistics
3. Look for sharing options
4. Try sharing an achievement

**Expected Results**:
- Global community stats (users, CO₂ saved)
- Personal ranking information
- Shareable achievement text
- Social media hashtags

**What to Check**:
- Numbers look realistic
- Ranking percentile makes sense
- Share functionality works (clipboard or native)
- Achievement text is motivating

### 7. Gamification System

**What to Test**: XP, levels, and achievements

**Steps**:
1. Open the extension popup (click CartHero icon)
2. Check current level and XP
3. Click alternative products to earn XP
4. Choose eco-friendly shipping options

**Expected Results**:
- Level progression (Eco Newcomer → Eco Legend)
- XP gains: +5 for viewing, +25 for choosing alternatives
- Achievement unlocks
- Streak tracking

**What to Check**:
- XP increases when taking sustainable actions
- Level badges update appropriately
- Achievements unlock logically
- Streak counter works

### 8. Interactive Features Testing

**What to Test**: All clickable elements and modals

**Steps**:
1. Click every button in the overlay
2. Test modal dialogs (alert settings)
3. Try form submissions
4. Test close/minimize functions

**Expected Results**:
- All buttons respond correctly
- Modals open and close properly
- Forms save data locally
- Animations work smoothly

## API Endpoint Testing

### Manual API Testing

You can test the backend directly:

```bash
# Test health endpoint
curl http://localhost:5001/api/health

# Test sustainability data
curl -X POST http://localhost:5001/api/sustainability \
  -H "Content-Type: application/json" \
  -d '{"title": "iPhone 15", "price": "$999", "brand": "Apple"}'

# Test price alert creation
curl -X POST http://localhost:5001/api/price-alert \
  -H "Content-Type: application/json" \
  -d '{"productData": {"title": "iPhone 15", "price": "$999"}, "alertSettings": {"targetPrice": 800}}'
```

## Common Issues & Solutions

### Extension Not Loading
- Check console for errors (F12 → Console)
- Verify manifest.json is valid
- Reload extension in Chrome extensions page

### API Not Working
- Ensure backend server is running
- Check CORS settings in app.py
- Verify port 5001 is not blocked

### Overlay Not Appearing
- Try different Amazon product pages
- Check if page structure matches selectors
- Look for JavaScript errors in console

### Features Not Working
- Clear browser cache and local storage
- Reload the extension
- Check network tab for failed API calls

## Feature-Specific Debugging

### Price Tracking Issues
- Check if product price is being extracted correctly
- Verify API call to `/api/price-alert` endpoint
- Look for localStorage data under 'priceAlerts'

### AI Scoring Problems
- Ensure sustainability score calculation in backend
- Check if product data is being sent correctly
- Verify score rendering in UI

### Gamification Not Working
- Check Chrome storage for XP and level data
- Verify gamification.js is loaded
- Test action tracking (clicking alternatives)

## Success Metrics

Your testing is successful when:

✅ All sections render with realistic data
✅ External links open correct marketplace searches
✅ Buttons respond and show appropriate feedback
✅ Modals open/close smoothly
✅ Data persists between page reloads
✅ XP and achievements update correctly
✅ API calls complete without errors
✅ No JavaScript console errors

## Next Steps After Testing

1. **Performance Testing**: Check load times on different pages
2. **Browser Compatibility**: Test in Firefox, Edge
3. **Mobile Testing**: Verify responsive design
4. **User Feedback**: Gather feedback from real users
5. **Analytics**: Track feature usage and engagement

Happy testing! 🌱