class CartHeroUserSystem {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  async init() {
    // Load user data from storage
    await this.loadUser();

    // Create user if doesn't exist
    if (!this.currentUser) {
      await this.createUser();
    }

    // Initialize daily tracking
    await this.initializeDailyTracking();
  }

  async createUser() {
    const userId = this.generateUserId();
    const user = {
      id: userId,
      createdAt: new Date().toISOString(),
      profile: {
        username: `EcoUser${Math.floor(Math.random() * 10000)}`,
        level: 1,
        xp: 0,
        totalCO2Saved: 0,
        totalMoneySaved: 0,
        itemsReused: 0,
        streak: 0,
        lastActiveDate: new Date().toISOString().split('T')[0]
      },
      preferences: {
        notifications: true,
        sustainabilityGoals: {
          monthly: {
            co2Target: 50, // kg CO2
            moneyTarget: 200, // dollars
            itemsTarget: 5
          }
        },
        alertSettings: {
          priceDropThreshold: 15,
          sustainabilityThreshold: 10,
          newAlternativesNotification: true,
          weeklyImpactSummary: true
        }
      },
      achievements: [],
      priceAlerts: [],
      statistics: {
        dailyStats: {},
        monthlyStats: {},
        categories: {}
      }
    };

    await chrome.storage.local.set({
      cartHeroUser: user,
      cartHeroUserId: userId
    });

    this.currentUser = user;
    console.log('CartHero: New user created:', userId);
    return user;
  }

  async loadUser() {
    try {
      const result = await chrome.storage.local.get(['cartHeroUser']);
      if (result.cartHeroUser) {
        this.currentUser = result.cartHeroUser;
        console.log('CartHero: User loaded:', this.currentUser.id);
      }
    } catch (error) {
      console.error('CartHero: Error loading user:', error);
    }
  }

  async saveUser() {
    if (this.currentUser) {
      await chrome.storage.local.set({ cartHeroUser: this.currentUser });
    }
  }

  generateUserId() {
    return 'chu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async initializeDailyTracking() {
    const today = new Date().toISOString().split('T')[0];
    const lastActiveDate = this.currentUser.profile.lastActiveDate;

    // Update streak
    if (lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActiveDate === yesterdayStr) {
        // Consecutive day - increment streak
        this.currentUser.profile.streak++;
      } else if (lastActiveDate !== today) {
        // Missed days - reset streak
        this.currentUser.profile.streak = 1;
      }

      this.currentUser.profile.lastActiveDate = today;
    }

    // Initialize today's stats if not exists
    if (!this.currentUser.statistics.dailyStats[today]) {
      this.currentUser.statistics.dailyStats[today] = {
        co2Saved: 0,
        moneySaved: 0,
        itemsViewed: 0,
        secondhandClicked: 0,
        ecoShippingChosen: 0,
        xpEarned: 0
      };
    }

    await this.saveUser();
  }

  async addXP(amount, reason = 'general') {
    if (!this.currentUser) return;

    this.currentUser.profile.xp += amount;

    // Check for level up
    const newLevel = Math.floor(this.currentUser.profile.xp / 100) + 1;
    if (newLevel > this.currentUser.profile.level) {
      this.currentUser.profile.level = newLevel;
      this.showLevelUpNotification(newLevel);
      await this.checkAchievements();
    }

    // Track daily XP
    const today = new Date().toISOString().split('T')[0];
    if (this.currentUser.statistics.dailyStats[today]) {
      this.currentUser.statistics.dailyStats[today].xpEarned += amount;
    }

    await this.saveUser();
    console.log(`CartHero: +${amount} XP (${reason}). Total: ${this.currentUser.profile.xp}`);
  }

  async trackAction(action, data = {}) {
    if (!this.currentUser) return;

    const today = new Date().toISOString().split('T')[0];
    const dailyStats = this.currentUser.statistics.dailyStats[today];

    switch (action) {
      case 'view_alternative':
        dailyStats.itemsViewed++;
        await this.addXP(5, 'viewing alternatives');
        break;

      case 'choose_secondhand':
        dailyStats.secondhandClicked++;
        this.currentUser.profile.itemsReused++;
        if (data.co2Saved) {
          this.currentUser.profile.totalCO2Saved += data.co2Saved;
          dailyStats.co2Saved += data.co2Saved;
        }
        if (data.moneySaved) {
          this.currentUser.profile.totalMoneySaved += data.moneySaved;
          dailyStats.moneySaved += data.moneySaved;
        }
        await this.addXP(25, 'choosing secondhand');
        break;

      case 'eco_shipping':
        dailyStats.ecoShippingChosen++;
        if (data.co2Saved) {
          this.currentUser.profile.totalCO2Saved += data.co2Saved;
          dailyStats.co2Saved += data.co2Saved;
        }
        await this.addXP(15, 'eco-friendly shipping');
        break;

      case 'save_co2':
        if (data.amount) {
          this.currentUser.profile.totalCO2Saved += data.amount;
          dailyStats.co2Saved += data.amount;
        }
        break;

      case 'price_alert_set':
        await this.addXP(10, 'setting price alert');
        break;
    }

    await this.saveUser();
    await this.checkAchievements();
  }

  async checkAchievements() {
    const achievements = [
      {
        id: 'first_alternative',
        name: 'Eco Explorer',
        description: 'View your first sustainable alternative',
        icon: '🌱',
        condition: () => this.currentUser.profile.itemsReused >= 1
      },
      {
        id: 'co2_saver_10',
        name: 'Carbon Crusher',
        description: 'Save 10kg of CO₂',
        icon: '💨',
        condition: () => this.currentUser.profile.totalCO2Saved >= 10
      },
      {
        id: 'co2_saver_50',
        name: 'Climate Hero',
        description: 'Save 50kg of CO₂',
        icon: '🌍',
        condition: () => this.currentUser.profile.totalCO2Saved >= 50
      },
      {
        id: 'money_saver_100',
        name: 'Smart Shopper',
        description: 'Save $100 through sustainable choices',
        icon: '💰',
        condition: () => this.currentUser.profile.totalMoneySaved >= 100
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        condition: () => this.currentUser.profile.streak >= 7
      },
      {
        id: 'level_5',
        name: 'Sustainability Master',
        description: 'Reach level 5',
        icon: '⭐',
        condition: () => this.currentUser.profile.level >= 5
      }
    ];

    const currentAchievementIds = this.currentUser.achievements.map(a => a.id);

    for (const achievement of achievements) {
      if (!currentAchievementIds.includes(achievement.id) && achievement.condition()) {
        this.currentUser.achievements.push({
          ...achievement,
          unlockedAt: new Date().toISOString()
        });
        this.showAchievementUnlocked(achievement);
        await this.addXP(50, `achievement: ${achievement.name}`);
      }
    }
  }

  showLevelUpNotification(level) {
    this.showNotification(`🎉 Level Up! You're now level ${level}!`, 'success');
  }

  showAchievementUnlocked(achievement) {
    this.showNotification(`🏆 Achievement Unlocked: ${achievement.icon} ${achievement.name}`, 'achievement');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#22c55e' : type === 'achievement' ? '#f59e0b' : '#3b82f6'};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 10001;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      animation: carthero-slide-in 0.5s ease-out;
      max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'carthero-fade-out 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  async addPriceAlert(productData, alertSettings) {
    if (!this.currentUser) return;

    const alert = {
      id: 'alert_' + Date.now(),
      productData,
      targetPrice: alertSettings.targetPrice,
      createdAt: new Date().toISOString(),
      active: true,
      triggered: false
    };

    this.currentUser.priceAlerts.push(alert);
    await this.saveUser();
    await this.trackAction('price_alert_set');

    return alert;
  }

  getProgressToNextLevel() {
    const currentLevelXP = (this.currentUser.profile.level - 1) * 100;
    const nextLevelXP = this.currentUser.profile.level * 100;
    const progress = this.currentUser.profile.xp - currentLevelXP;
    const needed = nextLevelXP - currentLevelXP;

    return {
      current: progress,
      needed: needed,
      percentage: Math.floor((progress / needed) * 100)
    };
  }

  getMonthlyProgress() {
    const now = new Date();
    const month = now.toISOString().substr(0, 7); // YYYY-MM

    let monthlyCO2 = 0;
    let monthlyMoney = 0;
    let monthlyItems = 0;

    // Sum up daily stats for current month
    Object.keys(this.currentUser.statistics.dailyStats).forEach(date => {
      if (date.startsWith(month)) {
        const dayStats = this.currentUser.statistics.dailyStats[date];
        monthlyCO2 += dayStats.co2Saved || 0;
        monthlyMoney += dayStats.moneySaved || 0;
        monthlyItems += dayStats.secondhandClicked || 0;
      }
    });

    const goals = this.currentUser.preferences.sustainabilityGoals.monthly;

    return {
      co2: { current: monthlyCO2, target: goals.co2Target, percentage: Math.min(100, Math.floor((monthlyCO2 / goals.co2Target) * 100)) },
      money: { current: monthlyMoney, target: goals.moneyTarget, percentage: Math.min(100, Math.floor((monthlyMoney / goals.moneyTarget) * 100)) },
      items: { current: monthlyItems, target: goals.itemsTarget, percentage: Math.min(100, Math.floor((monthlyItems / goals.itemsTarget) * 100)) }
    };
  }

  getDashboardData() {
    if (!this.currentUser) return null;

    return {
      profile: this.currentUser.profile,
      progress: this.getProgressToNextLevel(),
      monthlyProgress: this.getMonthlyProgress(),
      achievements: this.currentUser.achievements,
      recentStats: this.getTodayStats()
    };
  }

  getTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    return this.currentUser.statistics.dailyStats[today] || {
      co2Saved: 0,
      moneySaved: 0,
      itemsViewed: 0,
      secondhandClicked: 0,
      ecoShippingChosen: 0,
      xpEarned: 0
    };
  }
}

// Make available globally
window.CartHeroUserSystem = CartHeroUserSystem;