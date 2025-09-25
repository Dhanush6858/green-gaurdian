class CartHeroDashboard {
  constructor() {
    this.gamification = new CartHeroGamification();
    this.userSystem = null;
    this.userData = null;
    this.init();
  }

  async init() {
    // Load user data first
    await this.loadUserData();
    await this.loadGamificationData();
    this.updateDisplay();
    this.setupEventListeners();
    this.startRealTimeUpdates();
  }

  async loadUserData() {
    try {
      const result = await chrome.storage.local.get(['cartHeroUser']);
      this.userData = result.cartHeroUser;

      if (!this.userData) {
        // User doesn't exist yet, show placeholder
        this.userData = {
          profile: {
            level: 1,
            xp: 0,
            totalCO2Saved: 0,
            totalMoneySaved: 0,
            itemsReused: 0,
            streak: 0
          },
          achievements: [],
          statistics: { dailyStats: {} }
        };
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  async loadStats() {
    // This method is now handled by loadUserData
    // Keeping for backward compatibility
  }

  async loadGamificationData() {
    await this.gamification.loadUserData();
    this.userStats = this.gamification.getUserStats();
  }

  updateDisplay() {
    this.updateLevelInfo();
    this.updateProgressBar();
    this.updateStats();
    this.updateStreak();
    this.updateChallenges();
    this.updateAchievements();
  }

  updateLevelInfo() {
    if (!this.userData) return;

    const level = this.userData.profile.level;
    const xp = this.userData.profile.xp;

    // Level data
    const levelData = this.getLevelData(level);

    document.getElementById('level-icon').textContent = levelData.icon;
    document.getElementById('level-name').textContent = levelData.name;
    document.getElementById('level-number').textContent = `Lv.${level}`;
    document.getElementById('current-xp').textContent = xp;
  }

  getLevelData(level) {
    const levels = [
      { level: 1, name: 'Eco Newcomer', icon: '🌱' },
      { level: 2, name: 'Green Explorer', icon: '🍃' },
      { level: 3, name: 'Eco Warrior', icon: '⚔️' },
      { level: 4, name: 'Climate Champion', icon: '🌍' },
      { level: 5, name: 'Sustainability Master', icon: '⭐' },
      { level: 6, name: 'Carbon Crusher', icon: '💎' },
      { level: 7, name: 'Planet Protector', icon: '🛡️' },
      { level: 8, name: 'Eco Legend', icon: '👑' },
      { level: 9, name: 'Green Guardian', icon: '🦸' },
      { level: 10, name: 'Earth Hero', icon: '🌟' }
    ];

    return levels.find(l => l.level === level) || levels[0];
  }

  updateProgressBar() {
    if (!this.userData) return;

    const currentLevelXP = (this.userData.profile.level - 1) * 100;
    const nextLevelXP = this.userData.profile.level * 100;
    const progress = this.userData.profile.xp - currentLevelXP;
    const needed = nextLevelXP - currentLevelXP;
    const percentage = Math.min(100, (progress / needed) * 100);

    document.getElementById('level-progress-fill').style.width = `${percentage}%`;
    document.getElementById('xp-to-next').textContent = Math.max(0, needed - progress);
  }

  updateStats() {
    if (!this.userData) return;

    document.getElementById('total-co2-saved').textContent = this.userData.profile.totalCO2Saved.toFixed(1);
    document.getElementById('total-items-reused').textContent = this.userData.profile.itemsReused;
    document.getElementById('achievements-count').textContent = this.userData.achievements.length;
    document.getElementById('total-xp').textContent = this.userData.profile.xp;
  }

  updateStreak() {
    if (!this.userData) return;

    document.getElementById('streak-days').textContent = this.userData.profile.streak;
  }

  updateChallenges() {
    const challengesList = document.getElementById('challenges-list');

    // Today's challenges
    const today = new Date().toISOString().split('T')[0];
    const todayStats = this.userData.statistics.dailyStats[today] || {
      co2Saved: 0,
      secondhandClicked: 0,
      ecoShippingChosen: 0
    };

    const challenges = [
      {
        name: 'Save 5kg CO₂ Today',
        description: 'Choose eco-friendly options to reduce carbon footprint',
        icon: '💨',
        current: todayStats.co2Saved,
        target: 5,
        xp: 50,
        completed: todayStats.co2Saved >= 5
      },
      {
        name: 'Choose 3 Secondhand Items',
        description: 'Click on secondhand alternatives',
        icon: '♻️',
        current: todayStats.secondhandClicked,
        target: 3,
        xp: 30,
        completed: todayStats.secondhandClicked >= 3
      },
      {
        name: 'Use Eco Shipping Twice',
        description: 'Select eco-friendly delivery options',
        icon: '🚚',
        current: todayStats.ecoShippingChosen,
        target: 2,
        xp: 25,
        completed: todayStats.ecoShippingChosen >= 2
      }
    ];

    challengesList.innerHTML = challenges.map(challenge => `
      <div class="challenge-item ${challenge.completed ? 'completed' : ''}">
        <div class="challenge-header">
          <span class="challenge-icon">${challenge.icon}</span>
          <span class="challenge-name">${challenge.name}</span>
          <span class="challenge-xp">+${challenge.xp} XP</span>
        </div>
        <div class="challenge-description">${challenge.description}</div>
        <div class="challenge-progress">
          <div class="challenge-progress-fill" style="width: ${Math.min(100, (challenge.current / challenge.target) * 100)}%"></div>
        </div>
      </div>
    `).join('');
  }

  updateAchievements() {
    const achievementsGrid = document.getElementById('achievements-grid');

    const allAchievements = [
      { id: 'first_alternative', name: 'Eco Explorer', icon: '🌱', description: 'View your first sustainable alternative' },
      { id: 'co2_saver_10', name: 'Carbon Crusher', icon: '💨', description: 'Save 10kg of CO₂' },
      { id: 'co2_saver_50', name: 'Climate Hero', icon: '🌍', description: 'Save 50kg of CO₂' },
      { id: 'money_saver_100', name: 'Smart Shopper', icon: '💰', description: 'Save $100 through sustainable choices' },
      { id: 'streak_7', name: 'Week Warrior', icon: '🔥', description: 'Maintain a 7-day streak' },
      { id: 'level_5', name: 'Sustainability Master', icon: '⭐', description: 'Reach level 5' },
      { id: 'items_25', name: 'Reuse Champion', icon: '♻️', description: 'Reuse 25 items' },
      { id: 'eco_shipping_10', name: 'Green Delivery', icon: '🚚', description: 'Choose eco shipping 10 times' }
    ];

    const userAchievementIds = this.userData.achievements.map(a => a.id);

    achievementsGrid.innerHTML = allAchievements.map(achievement => `
      <div class="achievement-item ${userAchievementIds.includes(achievement.id) ? 'unlocked' : 'locked'}">
        ${achievement.icon}
        <div class="achievement-tooltip">${achievement.name}: ${achievement.description}</div>
      </div>
    `).join('');
  }

  updateProgressBar() {
    if (!this.userData) return;

    const currentLevelXP = (this.userData.profile.level - 1) * 100;
    const nextLevelXP = this.userData.profile.level * 100;
    const progress = this.userData.profile.xp - currentLevelXP;
    const needed = nextLevelXP - currentLevelXP;
    const percentage = Math.min(100, (progress / needed) * 100);

    document.getElementById('level-progress-fill').style.width = `${percentage}%`;
    document.getElementById('xp-to-next').textContent = Math.max(0, needed - progress);
  }

  updateStats() {
    if (!this.userData) return;

    document.getElementById('total-co2-saved').textContent = this.userData.profile.totalCO2Saved.toFixed(1);
    document.getElementById('total-items-reused').textContent = this.userData.profile.itemsReused;
    document.getElementById('achievements-count').textContent = this.userData.achievements.length;
    document.getElementById('total-xp').textContent = this.userData.profile.xp;
  }

  updateStreak() {
    if (!this.userData) return;

    const streakElement = document.getElementById('streak-days');
    const streak = this.userData.profile.streak;
    streakElement.textContent = streak;

    // Add animation for impressive streaks
    if (streak >= 7) {
      streakElement.style.animation = 'pulse 2s infinite';
    }

    // Change streak display color based on streak length
    const streakDisplay = document.querySelector('.streak-display');
    if (streak >= 30) {
      streakDisplay.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'; // Red fire
    } else if (streak >= 7) {
      streakDisplay.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'; // Orange fire
    }
  }

  updateChallenges() {
    const challengesList = document.getElementById('challenges-list');

    if (!this.userData) {
      challengesList.innerHTML = '<div class="loading">Loading challenges...</div>';
      return;
    }

    // Today's challenges using the userData structure we implemented
    const today = new Date().toISOString().split('T')[0];
    const todayStats = this.userData.statistics.dailyStats[today] || {
      co2Saved: 0,
      secondhandClicked: 0,
      ecoShippingChosen: 0
    };

    const challenges = [
      {
        name: 'Save 5kg CO₂ Today',
        description: 'Choose eco-friendly options to reduce carbon footprint',
        icon: '💨',
        current: todayStats.co2Saved || 0,
        target: 5,
        xp: 50,
        completed: (todayStats.co2Saved || 0) >= 5
      },
      {
        name: 'Choose 3 Secondhand Items',
        description: 'Click on secondhand alternatives',
        icon: '♻️',
        current: todayStats.secondhandClicked || 0,
        target: 3,
        xp: 30,
        completed: (todayStats.secondhandClicked || 0) >= 3
      },
      {
        name: 'Use Eco Shipping Twice',
        description: 'Select eco-friendly delivery options',
        icon: '🚚',
        current: todayStats.ecoShippingChosen || 0,
        target: 2,
        xp: 25,
        completed: (todayStats.ecoShippingChosen || 0) >= 2
      }
    ];

    challengesList.innerHTML = challenges.map(challenge => `
      <div class="challenge-item ${challenge.completed ? 'completed' : ''}">
        <div class="challenge-header">
          <span class="challenge-icon">${challenge.icon}</span>
          <span class="challenge-name">${challenge.name}</span>
          <span class="challenge-xp">+${challenge.xp} XP</span>
        </div>
        <div class="challenge-description">${challenge.description}</div>
        <div class="challenge-progress">
          <div class="challenge-progress-fill" style="width: ${Math.min(100, (challenge.current / challenge.target) * 100)}%"></div>
        </div>
        <div style="margin-top: 4px; font-size: 11px; color: #94a3b8;">
          ${challenge.current}/${challenge.target} ${challenge.name.includes('CO₂') ? 'kg' : 'completed'}
        </div>
      </div>
    `).join('');
  }

  updateAchievements() {
    const achievementsGrid = document.getElementById('achievements-grid');

    if (!this.userData) {
      achievementsGrid.innerHTML = '<div class="loading">Loading achievements...</div>';
      return;
    }

    const allAchievements = [
      { id: 'first_alternative', name: 'Eco Explorer', icon: '🌱', description: 'View your first sustainable alternative' },
      { id: 'co2_saver_10', name: 'Carbon Crusher', icon: '💨', description: 'Save 10kg of CO₂' },
      { id: 'co2_saver_50', name: 'Climate Hero', icon: '🌍', description: 'Save 50kg of CO₂' },
      { id: 'money_saver_100', name: 'Smart Shopper', icon: '💰', description: 'Save $100 through sustainable choices' },
      { id: 'streak_7', name: 'Week Warrior', icon: '🔥', description: 'Maintain a 7-day streak' },
      { id: 'level_5', name: 'Sustainability Master', icon: '⭐', description: 'Reach level 5' },
      { id: 'items_25', name: 'Reuse Champion', icon: '♻️', description: 'Reuse 25 items' },
      { id: 'eco_shipping_10', name: 'Green Delivery', icon: '🚚', description: 'Choose eco shipping 10 times' }
    ];

    const userAchievementIds = this.userData.achievements.map(a => a.id);

    achievementsGrid.innerHTML = allAchievements.map(achievement => `
      <div class="achievement-item ${userAchievementIds.includes(achievement.id) ? 'unlocked' : 'locked'}">
        ${achievement.icon}
        <div class="achievement-tooltip">${achievement.name}: ${achievement.description}</div>
      </div>
    `).join('');
  }

  setupEventListeners() {
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const feedbackLink = document.getElementById('feedback-link');
    const aboutLink = document.getElementById('about-link');

    if (leaderboardBtn) {
      leaderboardBtn.addEventListener('click', () => this.openLeaderboard());
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettings());
    }

    if (feedbackLink) {
      feedbackLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openFeedback();
      });
    }

    if (aboutLink) {
      aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showAbout();
      });
    }

    // Add click handlers for stat cards to show detailed info
    document.querySelectorAll('.stat-card').forEach((card, index) => {
      card.addEventListener('click', () => this.showStatDetails(index));
    });
  }

  startRealTimeUpdates() {
    // Update display every 5 seconds to catch any changes
    setInterval(async () => {
      await this.loadStats();
      await this.loadGamificationData();
      this.updateDisplay();
    }, 5000);

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        this.loadStats().then(() => {
          this.loadGamificationData().then(() => {
            this.updateDisplay();
          });
        });
      }
    });
  }

  openLeaderboard() {
    // Create a simple leaderboard modal
    this.showModal('🥇 Leaderboard', `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
        <h3 style="color: #22c55e; margin-bottom: 16px;">Global Rankings</h3>
        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>🥇 EcoChampion2024</span>
            <span style="color: #fbbf24;">12,450 XP</span>
          </div>
        </div>
        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>🥈 GreenGuru</span>
            <span style="color: #94a3b8;">9,280 XP</span>
          </div>
        </div>
        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>🥉 PlanetSaver</span>
            <span style="color: #cd7f32;">7,650 XP</span>
          </div>
        </div>
        <div style="background: rgba(34,197,94,0.2); border: 1px solid rgba(34,197,94,0.4); border-radius: 8px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>👤 You (${this.userStats.level.name})</span>
            <span style="color: #22c55e;">${this.userStats.xp} XP</span>
          </div>
        </div>
        <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
          Keep earning XP to climb the rankings!
        </p>
      </div>
    `);
  }

  openSettings() {
    this.showModal('⚙️ Settings', `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px;">
          <h4 style="color: #22c55e; margin-bottom: 12px;">Notifications</h4>
          <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <input type="checkbox" checked style="accent-color: #22c55e;">
            <span style="font-size: 14px;">XP and level up notifications</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <input type="checkbox" checked style="accent-color: #22c55e;">
            <span style="font-size: 14px;">Achievement notifications</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" checked style="accent-color: #22c55e;">
            <span style="font-size: 14px;">Daily challenge reminders</span>
          </label>
        </div>
        <div style="margin-bottom: 20px;">
          <h4 style="color: #22c55e; margin-bottom: 12px;">Privacy</h4>
          <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <input type="checkbox" style="accent-color: #22c55e;">
            <span style="font-size: 14px;">Share stats anonymously</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" style="accent-color: #22c55e;">
            <span style="font-size: 14px;">Join global leaderboard</span>
          </label>
        </div>
        <button onclick="this.parentElement.parentElement.parentElement.remove()"
                style="width: 100%; padding: 12px; background: #22c55e; border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">
          Save Settings
        </button>
      </div>
    `);
  }

  openFeedback() {
    chrome.tabs.create({ url: 'https://github.com/carthero/feedback' });
  }

  showAbout() {
    this.showModal('About CartHero', `
      <div style="padding: 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">🌱</div>
        <h3 style="color: #22c55e; margin-bottom: 12px;">CartHero v1.0.0</h3>
        <p style="font-size: 14px; color: #94a3b8; margin-bottom: 16px;">
          Gamifying sustainability, one purchase at a time.
        </p>
        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 16px; text-align: left;">
          <h4 style="color: #22c55e; margin-bottom: 8px;">Features:</h4>
          <ul style="font-size: 13px; color: #94a3b8; padding-left: 20px;">
            <li>Secondhand-first alternatives</li>
            <li>Durability insights & repair scores</li>
            <li>Carbon-aware shipping options</li>
            <li>XP and achievement system</li>
            <li>Daily challenges & streaks</li>
            <li>Global leaderboards</li>
          </ul>
        </div>
        <p style="font-size: 12px; color: #94a3b8;">
          Built with ❤️ for a more sustainable future.
        </p>
      </div>
    `);
  }

  showStatDetails(statIndex) {
    const statTitles = ['CO₂ Impact', 'Reuse Impact', 'Achievement Progress', 'XP Progress'];
    const statContents = [
      `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">💚</div>
          <h3 style="color: #22c55e; margin-bottom: 12px;">Your CO₂ Impact</h3>
          <div style="font-size: 32px; font-weight: 700; color: #22c55e; margin-bottom: 8px;">
            ${this.stats.co2Saved.toFixed(1)} kg
          </div>
          <p style="font-size: 14px; color: #94a3b8; margin-bottom: 16px;">
            CO₂ emissions prevented
          </p>
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px;">
            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 8px;">Equivalent to:</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px;">
              <div>🌳 ${Math.floor(this.stats.co2Saved / 22)} trees planted</div>
              <div>🚗 ${Math.floor(this.stats.co2Saved * 2.3)} miles not driven</div>
            </div>
          </div>
        </div>
      `,
      `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">♻️</div>
          <h3 style="color: #22c55e; margin-bottom: 12px;">Items Reused</h3>
          <div style="font-size: 32px; font-weight: 700; color: #22c55e; margin-bottom: 8px;">
            ${this.stats.itemsReused}
          </div>
          <p style="font-size: 14px; color: #94a3b8; margin-bottom: 16px;">
            Secondhand choices made
          </p>
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px;">
            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 8px;">Impact:</p>
            <div style="font-size: 12px;">
              <div>💰 ~$${(this.stats.itemsReused * 75).toFixed(0)} saved</div>
              <div style="margin-top: 4px;">🌍 Reduced manufacturing demand</div>
            </div>
          </div>
        </div>
      `,
      `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
          <h3 style="color: #22c55e; margin-bottom: 12px;">Achievements</h3>
          <div style="font-size: 32px; font-weight: 700; color: #22c55e; margin-bottom: 8px;">
            ${this.userStats.achievements}/${this.userStats.totalAchievements}
          </div>
          <p style="font-size: 14px; color: #94a3b8; margin-bottom: 16px;">
            Achievements unlocked
          </p>
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px;">
            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%); width: ${(this.userStats.achievements / this.userStats.totalAchievements * 100)}%; transition: width 0.5s ease;"></div>
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">
              ${Math.round(this.userStats.achievements / this.userStats.totalAchievements * 100)}% complete
            </p>
          </div>
        </div>
      `,
      `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">⭐</div>
          <h3 style="color: #22c55e; margin-bottom: 12px;">Experience Points</h3>
          <div style="font-size: 32px; font-weight: 700; color: #22c55e; margin-bottom: 8px;">
            ${this.userStats.xp}
          </div>
          <p style="font-size: 14px; color: #94a3b8; margin-bottom: 16px;">
            Total XP earned
          </p>
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px;">
            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 8px;">Next level:</p>
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">
              ${this.userStats.progress.isMaxLevel ? 'MAX LEVEL!' : `${this.userStats.progress.xpToNext} XP to go`}
            </div>
            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%); width: ${this.userStats.progress.progress}%; transition: width 0.5s ease;"></div>
            </div>
          </div>
        </div>
      `
    ];

    this.showModal(statTitles[statIndex], statContents[statIndex]);
  }

  showModal(title, content) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(10px);
    `;

    modal.innerHTML = `
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 16px; max-width: 400px; width: 90%; max-height: 80%; overflow-y: auto; position: relative;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 16px 20px; border-radius: 15px 15px 0 0; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${title}</h3>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 4px;">×</button>
        </div>
        <div style="color: #f1f5f9;">
          ${content}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  darkenColor(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new CartHeroDashboard();
});