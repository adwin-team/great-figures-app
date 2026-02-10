// ===================================
// LocalStorage Manager
// ===================================

class StorageManager {
    constructor() {
        this.storageKey = 'greatFiguresApp';
        this.defaultUserData = {
            level: 1,
            experience: 0,
            totalPoints: 0,
            streak: 0,
            lastPlayDate: null,
            unlockedFigures: [],
            badges: [],
            statistics: {
                totalQuestions: 0,
                correctAnswers: 0,
                accuracyRate: 0,
                categoryStats: {}
            },
            quizHistory: []
        };
    }

    /**
     * Initialize user data
     */
    initializeUserData() {
        const existingData = this.loadUserData();
        if (!existingData) {
            this.saveUserData(this.defaultUserData);
            debug('User data initialized');
            return this.defaultUserData;
        }
        return existingData;
    }

    /**
     * Load user data from LocalStorage
     * @returns {Object|null} User data or null if not found
     */
    loadUserData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                debug('User data loaded', parsed);
                return parsed;
            }
            return null;
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    }

    /**
     * Save user data to LocalStorage
     * @param {Object} userData - User data to save
     */
    saveUserData(userData) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(userData));
            debug('User data saved', userData);
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    /**
     * Update specific field in user data
     * @param {string} field - Field name
     * @param {*} value - New value
     */
    updateField(field, value) {
        const userData = this.loadUserData();
        if (userData) {
            userData[field] = value;
            this.saveUserData(userData);
        }
    }

    /**
     * Add points to user
     * @param {number} points - Points to add
     */
    addPoints(points) {
        const userData = this.loadUserData();
        if (userData) {
            userData.totalPoints += points;
            this.saveUserData(userData);
        }
    }

    /**
     * Add experience to user
     * @param {number} exp - Experience to add
     */
    addExperience(exp) {
        const userData = this.loadUserData();
        if (userData) {
            userData.experience += exp;
            this.saveUserData(userData);
        }
    }

    /**
     * Unlock a figure
     * @param {string} figureId - Figure ID to unlock
     */
    unlockFigure(figureId) {
        const userData = this.loadUserData();
        if (userData && !userData.unlockedFigures.includes(figureId)) {
            userData.unlockedFigures.push(figureId);
            this.saveUserData(userData);
            debug(`Figure unlocked: ${figureId}`);
        }
    }

    /**
     * Award a badge
     * @param {string} badgeId - Badge ID to award
     */
    awardBadge(badgeId) {
        const userData = this.loadUserData();
        if (userData && !userData.badges.includes(badgeId)) {
            userData.badges.push(badgeId);
            this.saveUserData(userData);
            debug(`Badge awarded: ${badgeId}`);
            return true;
        }
        return false;
    }

    /**
     * Update statistics
     * @param {Object} stats - Statistics to update
     */
    updateStatistics(stats) {
        const userData = this.loadUserData();
        if (userData) {
            // Update total questions and correct answers
            if (stats.totalQuestions !== undefined) {
                userData.statistics.totalQuestions += stats.totalQuestions;
            }
            if (stats.correctAnswers !== undefined) {
                userData.statistics.correctAnswers += stats.correctAnswers;
            }

            // Calculate accuracy rate
            if (userData.statistics.totalQuestions > 0) {
                userData.statistics.accuracyRate =
                    calculatePercentage(
                        userData.statistics.correctAnswers,
                        userData.statistics.totalQuestions
                    );
            }

            // Update category stats
            if (stats.category) {
                if (!userData.statistics.categoryStats[stats.category]) {
                    userData.statistics.categoryStats[stats.category] = {
                        total: 0,
                        correct: 0
                    };
                }
                userData.statistics.categoryStats[stats.category].total += stats.totalQuestions || 0;
                userData.statistics.categoryStats[stats.category].correct += stats.correctAnswers || 0;
            }

            this.saveUserData(userData);
        }
    }

    /**
     * Add quiz to history
     * @param {Object} quizResult - Quiz result data
     */
    addQuizToHistory(quizResult) {
        const userData = this.loadUserData();
        if (userData) {
            userData.quizHistory.push({
                ...quizResult,
                date: getToday(),
                timestamp: Date.now()
            });

            // Keep only last 50 quiz results
            if (userData.quizHistory.length > 50) {
                userData.quizHistory = userData.quizHistory.slice(-50);
            }

            this.saveUserData(userData);
        }
    }

    /**
     * Update streak
     */
    updateStreak() {
        const userData = this.loadUserData();
        if (userData) {
            const today = getToday();
            const lastPlayDate = userData.lastPlayDate;

            if (lastPlayDate === today) {
                // Already played today, no change
                return userData.streak;
            }

            if (lastPlayDate) {
                const lastDate = new Date(lastPlayDate);
                const todayDate = new Date(today);
                const diffTime = todayDate - lastDate;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Consecutive day
                    userData.streak += 1;
                } else if (diffDays > 1) {
                    // Streak broken
                    userData.streak = 1;
                }
            } else {
                // First play
                userData.streak = 1;
            }

            userData.lastPlayDate = today;
            this.saveUserData(userData);
            debug(`Streak updated: ${userData.streak}`);
            return userData.streak;
        }
        return 0;
    }

    /**
     * Reset all user data
     */
    resetUserData() {
        if (confirm('本当にすべてのデータをリセットしますか？この操作は取り消せません。')) {
            this.saveUserData(this.defaultUserData);
            debug('User data reset');
            window.location.reload();
        }
    }

    /**
     * Export user data as JSON
     * @returns {string} JSON string of user data
     */
    exportData() {
        const userData = this.loadUserData();
        return JSON.stringify(userData, null, 2);
    }

    /**
     * Import user data from JSON
     * @param {string} jsonData - JSON string of user data
     */
    importData(jsonData) {
        try {
            const userData = JSON.parse(jsonData);
            this.saveUserData(userData);
            debug('User data imported');
            window.location.reload();
        } catch (error) {
            console.error('Error importing data:', error);
            alert('データのインポートに失敗しました。');
        }
    }
}

// Create global instance
const storage = new StorageManager();
