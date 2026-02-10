// ===================================
// Gamification Manager
// ===================================

class GamificationManager {
    constructor() {
        this.badges = {
            beginner: { name: '初心者', icon: '🎓', condition: 'quiz_completed' },
            learner: { name: '学習者', icon: '📖', condition: 'correct_50' },
            scholar: { name: '博識', icon: '🎯', condition: 'correct_200' },
            perfectionist: { name: '完璧主義者', icon: '💯', condition: 'perfect_quiz' },
            streak_7: { name: '7日連続', icon: '🔥', condition: 'streak_7' },
            streak_30: { name: '30日連続', icon: '⭐', condition: 'streak_30' },
            scientist_master: { name: '科学の巨人', icon: '🔬', condition: 'category_scientist' },
            artist_master: { name: '芸術の達人', icon: '🎨', condition: 'category_artist' },
            politician_master: { name: '政治の賢者', icon: '⚖️', condition: 'category_politician' },
            inventor_master: { name: '発明の天才', icon: '💡', condition: 'category_inventor' },
            philosopher_master: { name: '哲学の探求者', icon: '🧠', condition: 'category_philosopher' }
        };
    }

    /**
     * Calculate required experience for next level
     * @param {number} level - Current level
     * @returns {number} Required experience
     */
    calculateRequiredExp(level) {
        return 100 * Math.pow(level, 2);
    }

    /**
     * Add experience and check for level up
     * @param {number} exp - Experience to add
     * @returns {Object} Level up information
     */
    addExperience(exp) {
        const userData = storage.loadUserData();
        if (!userData) return { leveledUp: false };

        const oldLevel = userData.level;
        userData.experience += exp;

        // Check for level up
        let leveledUp = false;
        let newLevel = oldLevel;

        while (userData.experience >= this.calculateRequiredExp(userData.level)) {
            userData.experience -= this.calculateRequiredExp(userData.level);
            userData.level += 1;
            leveledUp = true;
            newLevel = userData.level;
        }

        storage.saveUserData(userData);

        if (leveledUp) {
            debug(`Level up! ${oldLevel} → ${newLevel}`);
        }

        return {
            leveledUp,
            oldLevel,
            newLevel,
            currentExp: userData.experience,
            requiredExp: this.calculateRequiredExp(userData.level)
        };
    }

    /**
     * Calculate points based on difficulty and performance
     * @param {string} difficulty - Quiz difficulty
     * @param {boolean} isCorrect - Whether answer was correct
     * @param {number} consecutiveCorrect - Number of consecutive correct answers
     * @returns {number} Points earned
     */
    calculatePoints(difficulty, isCorrect, consecutiveCorrect = 0) {
        if (!isCorrect) return 0;

        const basePoints = {
            beginner: 10,
            intermediate: 20,
            advanced: 30
        };

        let points = basePoints[difficulty] || 10;

        // Consecutive correct bonus
        if (consecutiveCorrect >= 3) {
            points += 10;
        }
        if (consecutiveCorrect >= 5) {
            points += 20;
        }

        return points;
    }

    /**
     * Check and award badges based on conditions
     * @param {Object} quizResult - Quiz result data
     * @returns {Array} Newly awarded badges
     */
    checkBadgeConditions(quizResult) {
        const userData = storage.loadUserData();
        if (!userData) return [];

        const newBadges = [];

        // Check beginner badge (first quiz completed)
        if (!userData.badges.includes('beginner')) {
            if (storage.awardBadge('beginner')) {
                newBadges.push(this.badges.beginner);
            }
        }

        // Check perfectionist badge (10/10 correct)
        if (!userData.badges.includes('perfectionist')) {
            if (quizResult.correctAnswers === quizResult.totalQuestions) {
                if (storage.awardBadge('perfectionist')) {
                    newBadges.push(this.badges.perfectionist);
                }
            }
        }

        // Check learner badge (50+ correct answers)
        if (!userData.badges.includes('learner')) {
            if (userData.statistics.correctAnswers >= 50) {
                if (storage.awardBadge('learner')) {
                    newBadges.push(this.badges.learner);
                }
            }
        }

        // Check scholar badge (200+ correct answers)
        if (!userData.badges.includes('scholar')) {
            if (userData.statistics.correctAnswers >= 200) {
                if (storage.awardBadge('scholar')) {
                    newBadges.push(this.badges.scholar);
                }
            }
        }

        // Check streak badges
        if (!userData.badges.includes('streak_7')) {
            if (userData.streak >= 7) {
                if (storage.awardBadge('streak_7')) {
                    newBadges.push(this.badges.streak_7);
                }
            }
        }

        if (!userData.badges.includes('streak_30')) {
            if (userData.streak >= 30) {
                if (storage.awardBadge('streak_30')) {
                    newBadges.push(this.badges.streak_30);
                }
            }
        }

        return newBadges;
    }

    /**
     * Check category master badges
     * @param {string} category - Category to check
     * @param {Array} allFigures - All figures in the category
     */
    checkCategoryMaster(category, allFigures) {
        const userData = storage.loadUserData();
        if (!userData) return;

        const badgeId = `${category}_master`;
        if (userData.badges.includes(badgeId)) return;

        // Check if all figures in category are unlocked
        const categoryFigures = allFigures.filter(f => f.category === category);
        const allUnlocked = categoryFigures.every(f =>
            userData.unlockedFigures.includes(f.id)
        );

        if (allUnlocked && categoryFigures.length > 0) {
            if (storage.awardBadge(badgeId)) {
                debug(`Category master badge awarded: ${category}`);
                return this.badges[badgeId];
            }
        }

        return null;
    }

    /**
     * Get all badges with locked/unlocked status
     * @returns {Array} Badges with status
     */
    getAllBadges() {
        const userData = storage.loadUserData();
        if (!userData) return [];

        return Object.entries(this.badges).map(([id, badge]) => ({
            id,
            ...badge,
            unlocked: userData.badges.includes(id)
        }));
    }

    /**
     * Calculate bonus for consecutive correct answers
     * @param {number} consecutiveCorrect - Number of consecutive correct answers
     * @returns {number} Bonus points
     */
    calculateConsecutiveBonus(consecutiveCorrect) {
        if (consecutiveCorrect >= 5) return 30;
        if (consecutiveCorrect >= 3) return 10;
        return 0;
    }
}

// Create global instance
const gamification = new GamificationManager();
