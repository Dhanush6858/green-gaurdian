class CartHeroGamification {
  constructor() {
    this.levels = [
      { level: 1, name: "Eco Newcomer", xpRequired: 0, icon: "🌱", color: "#22c55e" },
      { level: 2, name: "Green Shopper", xpRequired: 100, icon: "♻️", color: "#16a34a" },
      { level: 3, name: "Sustainability Seeker", xpRequired: 250, icon: "🌿", color: "#15803d" },
      { level: 4, name: "Eco Warrior", xpRequired: 500, icon: "🌍", color: "#166534" },
      { level: 5, name: "Planet Guardian", xpRequired: 1000, icon: "🌳", color: "#14532d" },
      { level: 6, name: "Green Champion", xpRequired: 2000, icon: "🏆", color: "#365314" },
      { level: 7, name: "Sustainability Master", xpRequired: 4000, icon: "👑", color: "#1a2e05" },
      { level: 8, name: "Eco Legend", xpRequired: 8000, icon: "⭐", color: "#052e16" }
    ];

    this.challenges = {
      daily: [
        {
          id: "daily_secondhand",
          name: "Second Chance Sunday",
          description: "Choose a refurbished item over new",
          xp: 50,
          icon: "🔄",
          type: "action",
          target: 1,
          progress: 0
        },
        {
          id: "daily_shipping",
          name: "Slow & Steady",
          description: "Choose eco-friendly shipping",
          xp: 30,
          icon: "🚚",
          type: "action",
          target: 1,
          progress: 0
        },
        {
          id: "daily_co2_save",
          name: "Carbon Crusher",
          description: "Save 2kg CO₂ today",
          xp: 40,
          icon: "🌬️",
          type: "metric",
          target: 2,
          progress: 0
        }
      ],
      weekly: [
        {
          id: "weekly_streak",
          name: "Week Warrior",
          description: "Make sustainable choices 5 days this week",
          xp: 200,
          icon: "🔥",
          type: "streak",
          target: 5,
          progress: 0
        },
        {
          id: "weekly_explorer",
          name: "Alternative Explorer",
          description: "View 10 eco-alternatives this week",
          xp: 150,
          icon: "🔍",
          type: "explore",
          target: 10,
          progress: 0
        },
        {
          id: "weekly_saver",
          name: "Money & Planet Saver",
          description: "Save $50 with eco-choices this week",
          xp: 180,
          icon: "💰",
          type: "savings",
          target: 50,
          progress: 0
        }
      ],
      special: [
        {
          id: "earth_day",
          name: "Earth Day Champion",
          description: "Complete 5 sustainable actions on Earth Day",
          xp: 500,
          icon: "🌎",
          type: "special",
          target: 5,
          progress: 0,
          startDate: "2024-04-22",
          endDate: "2024-04-22"
        }
      ]
    };

    this.achievements = [
      {
        id: "first_steps",
        name: "First Steps",
        description: "Make your first sustainable choice",
        icon: "👶",
        xp: 25,
        rarity: "common",
        unlocked: false
      },
      {
        id: "streak_master",
        name: "Streak Master",
        description: "Maintain a 30-day sustainability streak",
        icon: "🔥",
        xp: 300,
        rarity: "epic",
        unlocked: false
      },
      {
        id: "co2_hero",
        name: "CO₂ Hero",
        description: "Save 100kg of CO₂ emissions",
        icon: "🦸",
        xp: 500,
        rarity: "legendary",
        unlocked: false
      },
      {
        id: "bargain_hunter",
        name: "Eco Bargain Hunter",
        description: "Save $1000 with sustainable choices",
        icon: "🎯",
        xp: 400,
        rarity: "epic",
        unlocked: false
      },
      {
        id: "community_leader",
        name: "Community Leader",
        description: "Rank in top 10 on leaderboard",
        icon: "👑",
        xp: 250,
        rarity: "rare",
        unlocked: false
      }
    ];

    this.init();
  }

  async init() {
    await this.loadUserData();
    this.generateDailyChallenges();
    this.checkLevelUp();
  }

  async loadUserData() {
    const result = await chrome.storage.local.get([
      'userXP', 'userLevel', 'currentStreak', 'longestStreak',
      'lastActiveDate', 'completedChallenges', 'unlockedAchievements',
      'weeklyProgress', 'totalSavings', 'alternativesViewed'
    ]);

    this.userXP = result.userXP || 0;
    this.userLevel = result.userLevel || 1;
    this.currentStreak = result.currentStreak || 0;
    this.longestStreak = result.longestStreak || 0;
    this.lastActiveDate = result.lastActiveDate || null;
    this.completedChallenges = result.completedChallenges || [];
    this.unlockedAchievements = result.unlockedAchievements || [];
    this.weeklyProgress = result.weeklyProgress || {};
    this.totalSavings = result.totalSavings || 0;
    this.alternativesViewed = result.alternativesViewed || 0;
  }

  async saveUserData() {
    await chrome.storage.local.set({
      userXP: this.userXP,
      userLevel: this.userLevel,
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      lastActiveDate: this.lastActiveDate,
      completedChallenges: this.completedChallenges,
      unlockedAchievements: this.unlockedAchievements,
      weeklyProgress: this.weeklyProgress,
      totalSavings: this.totalSavings,
      alternativesViewed: this.alternativesViewed
    });
  }

  async awardXP(amount, reason) {
    this.userXP += amount;

    const oldLevel = this.userLevel;
    this.checkLevelUp();

    await this.saveUserData();

    // Show XP notification
    this.showXPNotification(amount, reason);

    // Check for level up
    if (this.userLevel > oldLevel) {
      this.showLevelUpNotification(this.userLevel);
    }

    return {
      xpAwarded: amount,
      totalXP: this.userXP,
      leveledUp: this.userLevel > oldLevel,
      newLevel: this.userLevel
    };
  }

  checkLevelUp() {
    const currentLevelData = this.getCurrentLevelData();
    const nextLevelData = this.levels.find(l => l.level === currentLevelData.level + 1);

    if (nextLevelData && this.userXP >= nextLevelData.xpRequired) {
      this.userLevel = nextLevelData.level;
      return true;
    }
    return false;
  }

  getCurrentLevelData() {
    return this.levels.find(l => l.level === this.userLevel) || this.levels[0];
  }

  getProgressToNextLevel() {
    const currentLevel = this.getCurrentLevelData();
    const nextLevel = this.levels.find(l => l.level === currentLevel.level + 1);

    if (!nextLevel) {
      return { progress: 100, isMaxLevel: true };
    }

    const currentLevelXP = currentLevel.xpRequired;
    const nextLevelXP = nextLevel.xpRequired;
    const userProgress = this.userXP - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;

    return {
      progress: Math.min(100, (userProgress / xpNeeded) * 100),
      xpToNext: Math.max(0, nextLevelXP - this.userXP),
      isMaxLevel: false
    };
  }

  async trackAction(actionType, data = {}) {
    let xpAwarded = 0;
    const today = new Date().toDateString();

    // Update streak
    if (this.lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (this.lastActiveDate === yesterday.toDateString()) {
        this.currentStreak++;
      } else {
        this.currentStreak = 1;
      }

      this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
      this.lastActiveDate = today;
    }

    // Award XP based on action type
    switch (actionType) {
      case 'view_alternative':
        xpAwarded = 5;
        this.alternativesViewed++;
        break;
      case 'choose_secondhand':
        xpAwarded = 25;
        await this.updateChallengeProgress('daily_secondhand');
        break;
      case 'eco_shipping':
        xpAwarded = 15;
        await this.updateChallengeProgress('daily_shipping');
        break;
      case 'save_co2':
        xpAwarded = Math.floor(data.amount * 10); // 10 XP per kg CO2
        await this.updateChallengeProgress('daily_co2_save', data.amount);
        break;
      case 'save_money':
        xpAwarded = Math.floor(data.amount / 5); // 1 XP per $5 saved
        this.totalSavings += data.amount;
        break;
    }

    if (xpAwarded > 0) {
      await this.awardXP(xpAwarded, this.getActionDescription(actionType));
    }

    // Check achievements
    await this.checkAchievements();

    await this.saveUserData();
  }

  getActionDescription(actionType) {
    const descriptions = {
      'view_alternative': 'Explored eco-friendly alternative',
      'choose_secondhand': 'Chose secondhand over new',
      'eco_shipping': 'Selected eco-friendly shipping',
      'save_co2': 'Reduced carbon footprint',
      'save_money': 'Saved money sustainably'
    };
    return descriptions[actionType] || 'Sustainable action';
  }

  async updateChallengeProgress(challengeId, amount = 1) {
    const challenge = this.findChallenge(challengeId);
    if (!challenge) return;

    challenge.progress = Math.min(challenge.target, challenge.progress + amount);

    if (challenge.progress >= challenge.target && !this.completedChallenges.includes(challengeId)) {
      await this.completeChallenge(challengeId);
    }
  }

  findChallenge(challengeId) {
    return [...this.challenges.daily, ...this.challenges.weekly, ...this.challenges.special]
      .find(c => c.id === challengeId);
  }

  async completeChallenge(challengeId) {
    const challenge = this.findChallenge(challengeId);
    if (!challenge || this.completedChallenges.includes(challengeId)) return;

    this.completedChallenges.push(challengeId);
    await this.awardXP(challenge.xp, `Completed: ${challenge.name}`);

    this.showChallengeCompleteNotification(challenge);
  }

  async checkAchievements() {
    for (const achievement of this.achievements) {
      if (this.unlockedAchievements.includes(achievement.id)) continue;

      let unlocked = false;

      switch (achievement.id) {
        case 'first_steps':
          unlocked = this.userXP > 0;
          break;
        case 'streak_master':
          unlocked = this.longestStreak >= 30;
          break;
        case 'co2_hero':
          const result = await chrome.storage.local.get(['co2Saved']);
          unlocked = (result.co2Saved || 0) >= 100;
          break;
        case 'bargain_hunter':
          unlocked = this.totalSavings >= 1000;
          break;
        case 'community_leader':
          // This would check against leaderboard data
          unlocked = false; // Placeholder
          break;
      }

      if (unlocked) {
        await this.unlockAchievement(achievement.id);
      }
    }
  }

  async unlockAchievement(achievementId) {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement || this.unlockedAchievements.includes(achievementId)) return;

    this.unlockedAchievements.push(achievementId);
    await this.awardXP(achievement.xp, `Achievement: ${achievement.name}`);

    this.showAchievementNotification(achievement);
  }

  generateDailyChallenges() {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('lastChallengeDate');

    if (storedDate !== today) {
      // Reset daily challenge progress
      this.challenges.daily.forEach(challenge => {
        challenge.progress = 0;
      });

      // Remove completed daily challenges
      this.completedChallenges = this.completedChallenges.filter(id =>
        !this.challenges.daily.some(c => c.id === id)
      );

      localStorage.setItem('lastChallengeDate', today);
    }
  }

  showXPNotification(amount, reason) {
    this.createNotification({
      title: `+${amount} XP`,
      message: reason,
      icon: '⭐',
      color: '#fbbf24',
      duration: 2000
    });
  }

  showLevelUpNotification(newLevel) {
    const levelData = this.getCurrentLevelData();
    this.createNotification({
      title: `Level Up! 🎉`,
      message: `You're now a ${levelData.name}!`,
      icon: levelData.icon,
      color: levelData.color,
      duration: 4000,
      special: true
    });
  }

  showChallengeCompleteNotification(challenge) {
    this.createNotification({
      title: `Challenge Complete! ${challenge.icon}`,
      message: `${challenge.name} (+${challenge.xp} XP)`,
      icon: '🏆',
      color: '#22c55e',
      duration: 3000
    });
  }

  showAchievementNotification(achievement) {
    this.createNotification({
      title: `Achievement Unlocked! 🏆`,
      message: `${achievement.name} (+${achievement.xp} XP)`,
      icon: achievement.icon,
      color: '#8b5cf6',
      duration: 4000,
      special: true
    });
  }

  createNotification({ title, message, icon, color, duration = 3000, special = false }) {
    const notification = document.createElement('div');
    notification.className = `carthero-game-notification ${special ? 'special' : ''}`;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, ${color}22 0%, ${color}11 100%);
      border: 2px solid ${color};
      color: ${color};
      padding: 16px 20px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      font-weight: 600;
      z-index: 10002;
      box-shadow: 0 8px 32px ${color}33;
      backdrop-filter: blur(10px);
      animation: carthero-slide-in 0.4s ease-out;
      max-width: 300px;
      ${special ? `
        transform: scale(1.1);
        box-shadow: 0 12px 40px ${color}44;
        border-width: 3px;
      ` : ''}
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">${icon}</span>
        <div>
          <div style="font-size: 14px; font-weight: 700;">${title}</div>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">${message}</div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'carthero-fade-out 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  getUserStats() {
    const levelData = this.getCurrentLevelData();
    const progress = this.getProgressToNextLevel();

    return {
      level: levelData,
      xp: this.userXP,
      progress: progress,
      streak: this.currentStreak,
      longestStreak: this.longestStreak,
      achievements: this.unlockedAchievements.length,
      totalAchievements: this.achievements.length,
      completedChallenges: this.completedChallenges.length,
      activeChallenges: this.getActiveChallenges()
    };
  }

  getActiveChallenges() {
    return [...this.challenges.daily, ...this.challenges.weekly]
      .filter(c => !this.completedChallenges.includes(c.id))
      .map(c => ({
        ...c,
        progressPercent: (c.progress / c.target) * 100
      }));
  }
}

// Export for use in other files
window.CartHeroGamification = CartHeroGamification;