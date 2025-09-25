# CartHero - Sustainable Shopping Assistant

Transform online shopping into sustainable choices with secondhand alternatives, durability insights, and carbon-aware delivery options.

## 🌱 Features

- **Secondhand-first alternatives** - Refurbished/used listings from eBay, BackMarket, and other marketplaces
- **Durability insights** - Repairability scores and warranty information
- **Carbon-aware delivery** - CO₂ emissions comparison for different shipping options
- **Impact tracker** - Running tally of CO₂ saved and items reused
- **Achievement system** - Gamified sustainability goals

## 📂 Project Structure

```
carthero-extension/
├── manifest.json           # Extension configuration
├── content.js             # Product page parsing and overlay injection
├── overlay.css            # Overlay styling
├── overlay.html           # Overlay template
├── background.js          # Service worker for API calls
├── popup.html             # Extension dashboard
├── popup.js               # Dashboard logic
├── icons/                 # Extension icons
└── assets/                # Images and assets

backend/
├── app.py                 # Flask API server
├── requirements.txt       # Python dependencies
└── mock_data/            # JSON datasets
    ├── secondhand.json   # Sample secondhand listings
    ├── durability.json   # Product durability data
    └── emissions.json    # Shipping emissions data
```

## 🚀 Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the API Server

```bash
python app.py
```

The server will start on `http://localhost:5001`

### 3. Load Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `carthero-extension` folder
5. The extension will appear in your browser toolbar

### 4. Test the Extension

1. Visit any Amazon product page
2. The CartHero overlay should appear with sustainable alternatives
3. Click the extension icon to view your dashboard

## 🔧 API Endpoints

- `POST /api/sustainability` - Get comprehensive sustainability data
- `GET /api/search-secondhand` - Search secondhand options
- `GET /api/durability/<id>` - Get durability information
- `GET /api/emissions` - Calculate shipping emissions
- `GET /api/health` - Health check

## 📊 Dashboard Features

- **CO₂ Saved Tracker** - Total carbon emissions prevented
- **Items Reused Counter** - Number of secondhand purchases
- **Achievement System** - Unlock badges for sustainable choices
- **Recent Activity** - History of your eco-friendly actions

## 🌍 Supported Sites

Currently supports:
- Amazon (all major domains: .com, .co.uk, .ca, .de, .fr)

## 🛠️ Development

### Extension Development

The extension uses Manifest V3 with:
- Content scripts for page parsing
- Service worker for background tasks
- Chrome Storage API for data persistence
- Cross-origin requests to the backend API

### Backend Development

Flask API with:
- CORS enabled for extension communication
- Mock data for offline functionality
- Real-time sustainability calculations
- RESTful API design

## 🔒 Privacy & Security

- No personal data collection
- All tracking data stored locally
- Optional anonymous usage analytics
- Secure API communication

## 🎯 Roadmap

- [ ] Support for more e-commerce sites (eBay, Walmart, etc.)
- [ ] Real eBay/BackMarket API integration
- [ ] Carbon footprint calculator
- [ ] Browser sync for cross-device tracking
- [ ] Community features and leaderboards

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 💡 API Usage Examples

### Get Sustainability Data
```javascript
const response = await fetch('http://localhost:5001/api/sustainability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'iPhone 13 Pro',
    price: '$999.99',
    brand: 'Apple'
  })
});
```

### Search Secondhand Options
```javascript
const response = await fetch('http://localhost:5001/api/search-secondhand?q=iPhone 13&limit=5');
```

## 🏆 Achievements

- **First Steps** - Save your first 1kg of CO₂
- **Reuse Champion** - Purchase your first reused item
- **Climate Hero** - Save 10kg of CO₂ emissions
- **Sustainability Star** - Reuse 5 items instead of buying new
- **Eco Warrior** - Save 50kg of CO₂ emissions
- **Master Reuser** - Reuse 20 items instead of buying new