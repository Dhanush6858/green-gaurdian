class CartHeroBackground {
  constructor() {
    this.apiBaseUrl = 'http://localhost:5001';
    this.setupEventListeners();
  }

  setupEventListeners() {
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });
  }

  async handleInstall(details) {
    if (details.reason === 'install') {
      await this.initializeExtension();
      this.showWelcomeNotification();
    } else if (details.reason === 'update') {
      await this.handleUpdate(details);
    }
  }

  async initializeExtension() {
    try {
      const defaultData = {
        co2Saved: 0,
        itemsReused: 0,
        recentActivity: [],
        unlockedAchievements: [],
        settings: {
          enableNotifications: true,
          enableOverlay: true,
          preferredMarketplaces: ['ebay', 'backmarket'],
          carbonEmissionUnits: 'kg'
        },
        installDate: Date.now()
      };

      await chrome.storage.local.set(defaultData);
      console.log('CartHero: Extension initialized with default data');
    } catch (error) {
      console.error('CartHero: Error initializing extension:', error);
    }
  }

  showWelcomeNotification() {
    chrome.notifications.create({
      type: 'basic',
      title: 'Welcome to CartHero! 🌱',
      message: 'Start shopping sustainably! Visit any product page to see eco-friendly alternatives.'
    });
  }

  async handleUpdate(details) {
    console.log(`CartHero: Updated from version ${details.previousVersion} to ${chrome.runtime.getManifest().version}`);
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'fetchSustainabilityData':
          const data = await this.fetchSustainabilityData(message.productData);
          sendResponse({ success: true, data });
          break;

        case 'updateStats':
          await this.updateStats(message.statType, message.value);
          sendResponse({ success: true });
          break;

        case 'trackAction':
          await this.trackUserAction(message.action, message.data);
          sendResponse({ success: true });
          break;

        case 'getSettings':
          const settings = await this.getSettings();
          sendResponse({ success: true, settings });
          break;

        case 'updateSettings':
          await this.updateSettings(message.settings);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('CartHero: Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async fetchSustainabilityData(productData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/sustainability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('CartHero: API request failed, returning fallback data:', error);
      return this.getFallbackData(productData);
    }
  }

  getFallbackData(productData) {
    const basePrice = this.extractPriceNumber(productData.price);
    const discountedPrice = basePrice ? (basePrice * 0.6).toFixed(2) : '99.99';

    return {
      secondhandOptions: [
        {
          title: `Refurbished ${productData.title.substring(0, 40)}...`,
          price: `$${discountedPrice}`,
          condition: 'Excellent',
          warranty: '6 months',
          seller: 'EcoRefurb Store',
          url: `https://ebay.com/search?q=${encodeURIComponent(productData.title)}`,
          savings: `Save ${Math.floor(Math.random() * 30 + 20)}%`,
          co2Reduction: '2.5 kg CO₂ saved'
        },
        {
          title: `Used ${productData.title.substring(0, 40)}...`,
          price: `$${(discountedPrice * 0.8).toFixed(2)}`,
          condition: 'Good',
          warranty: '3 months',
          seller: 'GreenTech Marketplace',
          url: `https://backmarket.com/search?q=${encodeURIComponent(productData.title)}`,
          savings: `Save ${Math.floor(Math.random() * 50 + 30)}%`,
          co2Reduction: '3.8 kg CO₂ saved'
        }
      ],
      durability: {
        repairabilityScore: Math.floor(Math.random() * 4) + 6,
        warrantyLength: '12 months',
        expectedLifespan: '3-5 years',
        repairGuides: Math.floor(Math.random() * 15) + 5,
        partAvailability: 'Good'
      },
      shipping: {
        express: {
          days: '1-2',
          co2: '4.2 kg CO₂',
          cost: '$15.99'
        },
        standard: {
          days: '3-5',
          co2: '2.1 kg CO₂',
          cost: '$7.99'
        },
        noRush: {
          days: '7-10',
          co2: '1.2 kg CO₂',
          cost: 'Free'
        }
      },
      recommendations: {
        buySecondhand: productData.title.toLowerCase().includes('phone') ||
                      productData.title.toLowerCase().includes('laptop') ||
                      productData.title.toLowerCase().includes('tablet'),
        repairInstead: false,
        waitForSale: Math.random() > 0.7
      }
    };
  }

  extractPriceNumber(priceString) {
    if (!priceString) return null;
    const match = priceString.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(',', '')) : null;
  }

  async updateStats(statType, value) {
    try {
      const result = await chrome.storage.local.get(['co2Saved', 'itemsReused', 'recentActivity']);

      let updatedData = {};

      if (statType === 'co2') {
        const newCo2Value = (result.co2Saved || 0) + value;
        updatedData.co2Saved = newCo2Value;
        await this.addActivity(`Saved ${value.toFixed(1)}kg CO₂ with sustainable choice`);
      } else if (statType === 'items') {
        const newItemsValue = (result.itemsReused || 0) + value;
        updatedData.itemsReused = newItemsValue;
        await this.addActivity('Chose reused item instead of buying new');
      }

      await chrome.storage.local.set(updatedData);
      await this.checkAndUnlockAchievements();

    } catch (error) {
      console.error('CartHero: Error updating stats:', error);
      throw error;
    }
  }

  async addActivity(action) {
    try {
      const result = await chrome.storage.local.get(['recentActivity']);
      let activities = result.recentActivity || [];

      activities.push({
        action: action,
        timestamp: Date.now()
      });

      if (activities.length > 50) {
        activities = activities.slice(-50);
      }

      await chrome.storage.local.set({ recentActivity: activities });
    } catch (error) {
      console.error('CartHero: Error adding activity:', error);
    }
  }

  async checkAndUnlockAchievements() {
    try {
      const result = await chrome.storage.local.get(['co2Saved', 'itemsReused', 'unlockedAchievements']);
      const co2Saved = result.co2Saved || 0;
      const itemsReused = result.itemsReused || 0;
      const unlockedAchievements = result.unlockedAchievements || [];

      const achievements = [
        { id: 'first-steps', requirement: 'co2', value: 1, title: 'First Steps' },
        { id: 'reuse-champion', requirement: 'items', value: 1, title: 'Reuse Champion' },
        { id: 'climate-hero', requirement: 'co2', value: 10, title: 'Climate Hero' },
        { id: 'sustainability-star', requirement: 'items', value: 5, title: 'Sustainability Star' },
        { id: 'eco-warrior', requirement: 'co2', value: 50, title: 'Eco Warrior' },
        { id: 'master-reuser', requirement: 'items', value: 20, title: 'Master Reuser' }
      ];

      const newUnlocked = [];

      achievements.forEach(achievement => {
        if (!unlockedAchievements.includes(achievement.id)) {
          const currentValue = achievement.requirement === 'co2' ? co2Saved : itemsReused;
          if (currentValue >= achievement.value) {
            newUnlocked.push(achievement.id);
            this.showAchievementNotification(achievement.title);
          }
        }
      });

      if (newUnlocked.length > 0) {
        await chrome.storage.local.set({
          unlockedAchievements: [...unlockedAchievements, ...newUnlocked]
        });
      }

    } catch (error) {
      console.error('CartHero: Error checking achievements:', error);
    }
  }

  showAchievementNotification(title) {
    chrome.notifications.create({
      type: 'basic',
      title: '🏆 Achievement Unlocked!',
      message: `You earned: ${title}`
    });
  }

  async trackUserAction(action, data) {
    try {
      console.log(`CartHero: User action tracked - ${action}`, data);

      const result = await chrome.storage.local.get(['userActions']);
      const userActions = result.userActions || [];

      userActions.push({
        action: action,
        data: data,
        timestamp: Date.now(),
        url: data.url || 'unknown'
      });

      if (userActions.length > 100) {
        userActions.splice(0, userActions.length - 100);
      }

      await chrome.storage.local.set({ userActions });
    } catch (error) {
      console.error('CartHero: Error tracking user action:', error);
    }
  }

  async getSettings() {
    try {
      const result = await chrome.storage.local.get(['settings']);
      return result.settings || {
        enableNotifications: true,
        enableOverlay: true,
        preferredMarketplaces: ['ebay', 'backmarket'],
        carbonEmissionUnits: 'kg'
      };
    } catch (error) {
      console.error('CartHero: Error getting settings:', error);
      return {};
    }
  }

  async updateSettings(newSettings) {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      await chrome.storage.local.set({ settings: updatedSettings });
    } catch (error) {
      console.error('CartHero: Error updating settings:', error);
      throw error;
    }
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      this.checkIfProductPage(tab);
    }
  }

  checkIfProductPage(tab) {
    const productPageRegex = /amazon\.(com|co\.uk|ca|de|fr)\/.*\/dp\/[A-Z0-9]{10}/;
    if (productPageRegex.test(tab.url)) {
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: '🌱'
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#22c55e'
      });
    } else {
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: ''
      });
    }
  }

  handleActionClick(tab) {
    console.log('CartHero: Extension icon clicked on tab:', tab.url);
  }
}

new CartHeroBackground();