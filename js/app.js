// ===================================
// Main Application
// ===================================

class App {
    constructor() {
        this.figures = [];
        this.currentScreen = 'home-screen';
        this.userData = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        debug('Initializing app...');

        // Initialize user data
        this.userData = storage.initializeUserData();

        // Load data
        await this.loadFigures();
        await quiz.loadQuestions();

        // Setup event listeners
        this.setupEventListeners();

        // Update UI
        this.updateUserStatus();
        this.showScreen('home-screen');

        debug('App initialized');
    }

    /**
     * Load figures from JSON file
     */
    async loadFigures() {
        try {
            const response = await fetch('data/figures.json');
            const data = await response.json();
            this.figures = data.figures;
            debug('Figures loaded', this.figures.length);
        } catch (error) {
            console.error('Error loading figures:', error);
            alert('偉人データの読み込みに失敗しました。');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Home screen buttons
        document.getElementById('btn-start-quiz').addEventListener('click', () => {
            this.showDifficultyModal();
        });

        document.getElementById('btn-encyclopedia').addEventListener('click', () => {
            this.showEncyclopedia();
        });

        document.getElementById('btn-statistics').addEventListener('click', () => {
            this.showStatistics();
        });

        document.getElementById('btn-daily-challenge').addEventListener('click', () => {
            this.startDailyChallenge();
        });

        // Difficulty modal
        document.querySelectorAll('.btn-difficulty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const difficulty = e.currentTarget.dataset.difficulty;
                this.startQuiz(difficulty);
            });
        });

        document.getElementById('btn-close-difficulty').addEventListener('click', () => {
            this.closeDifficultyModal();
        });

        // Quiz screen
        document.getElementById('btn-back-from-quiz').addEventListener('click', () => {
            if (confirm('クイズを中断しますか？')) {
                this.showScreen('home-screen');
            }
        });

        document.getElementById('btn-next-question').addEventListener('click', () => {
            this.nextQuestion();
        });

        // Results modal
        document.getElementById('btn-retry-quiz').addEventListener('click', () => {
            this.closeResultsModal();
            this.showDifficultyModal();
        });

        document.getElementById('btn-back-home').addEventListener('click', () => {
            this.closeResultsModal();
            this.showScreen('home-screen');
        });

        // Encyclopedia screen
        document.getElementById('btn-back-from-encyclopedia').addEventListener('click', () => {
            this.showScreen('home-screen');
        });

        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filterFigures(e.target.value);
        });

        document.getElementById('search-input').addEventListener('input', debounce((e) => {
            this.searchFigures(e.target.value);
        }, 300));

        document.getElementById('btn-close-figure-detail').addEventListener('click', () => {
            this.closeFigureDetailModal();
        });

        // Statistics screen
        document.getElementById('btn-back-from-statistics').addEventListener('click', () => {
            this.showScreen('home-screen');
        });
    }

    /**
     * Update user status display
     */
    updateUserStatus() {
        this.userData = storage.loadUserData();
        if (!this.userData) return;

        // Update level, points, streak
        document.getElementById('user-level').textContent = this.userData.level;
        document.getElementById('user-points').textContent = this.userData.totalPoints;
        document.getElementById('user-streak').textContent = this.userData.streak;

        // Update experience bar
        const currentExp = this.userData.experience;
        const requiredExp = gamification.calculateRequiredExp(this.userData.level);
        const expPercentage = calculatePercentage(currentExp, requiredExp);

        document.getElementById('exp-fill').style.width = `${expPercentage}%`;
        document.getElementById('current-exp').textContent = currentExp;
        document.getElementById('required-exp').textContent = requiredExp;
    }

    /**
     * Show a screen
     * @param {string} screenId - Screen ID to show
     */
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            debug(`Screen changed to: ${screenId}`);
        }
    }

    /**
     * Show difficulty selection modal
     */
    showDifficultyModal() {
        const modal = document.getElementById('difficulty-modal');
        modal.classList.add('active');
    }

    /**
     * Close difficulty modal
     */
    closeDifficultyModal() {
        const modal = document.getElementById('difficulty-modal');
        modal.classList.remove('active');
    }

    /**
     * Start quiz with selected difficulty
     * @param {string} difficulty - Difficulty level
     */
    startQuiz(difficulty) {
        this.closeDifficultyModal();

        if (quiz.startQuiz(difficulty)) {
            this.showScreen('quiz-screen');
            this.displayQuestion();
        }
    }

    /**
     * Display current question
     */
    displayQuestion() {
        const question = quiz.getCurrentQuestion();
        if (!question) return;

        // Update progress
        const progress = quiz.getProgress();
        document.getElementById('quiz-progress-fill').style.width = `${progress}%`;
        document.getElementById('current-question').textContent = quiz.currentQuestionIndex + 1;
        document.getElementById('total-questions').textContent = quiz.currentQuestions.length;

        // Update score
        document.getElementById('quiz-score').textContent = quiz.score;

        // Display question
        document.getElementById('question-text').textContent = question.question;

        // Display options
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.addEventListener('click', () => this.selectAnswer(index));
            optionsContainer.appendChild(button);
        });

        // Hide feedback section
        hideElement(document.getElementById('feedback-section'));
    }

    /**
     * Handle answer selection
     * @param {number} optionIndex - Selected option index
     */
    async selectAnswer(optionIndex) {
        const result = quiz.checkAnswer(optionIndex);
        if (!result) return;

        // Disable all option buttons
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
        });

        // Highlight correct and incorrect answers
        const optionButtons = document.querySelectorAll('.option-btn');
        optionButtons[result.correctAnswer].classList.add('correct');

        if (!result.isCorrect) {
            optionButtons[optionIndex].classList.add('incorrect');
        }

        // Show feedback
        await delay(500);
        this.showFeedback(result);
    }

    /**
     * Show feedback for answer
     * @param {Object} result - Answer result
     */
    showFeedback(result) {
        const feedbackSection = document.getElementById('feedback-section');
        const feedbackResult = document.getElementById('feedback-result');
        const feedbackExplanation = document.getElementById('feedback-explanation');

        feedbackResult.textContent = result.isCorrect ? '✓ 正解！' : '✗ 不正解';
        feedbackResult.className = `feedback-result ${result.isCorrect ? 'correct' : 'incorrect'}`;
        feedbackExplanation.textContent = result.explanation;

        showElement(feedbackSection, 'animate-slide-up');
    }

    /**
     * Move to next question
     */
    nextQuestion() {
        if (quiz.nextQuestion()) {
            this.displayQuestion();
        } else {
            this.showResults();
        }
    }

    /**
     * Show quiz results
     */
    showResults() {
        const results = quiz.getResults();

        // Update results display
        document.getElementById('result-correct').textContent = results.correctAnswers;
        document.getElementById('result-total').textContent = results.totalQuestions;
        document.getElementById('result-points').textContent = results.score;

        // Show level up notification if applicable
        const levelUpNotification = document.getElementById('level-up-notification');
        if (results.levelUpInfo.leveledUp) {
            document.getElementById('new-level').textContent = results.levelUpInfo.newLevel;
            showElement(levelUpNotification);
        } else {
            hideElement(levelUpNotification);
        }

        // Show badge notifications if applicable
        const badgeNotification = document.getElementById('badge-notification');
        const newBadgesContainer = document.getElementById('new-badges-container');

        if (results.newBadges.length > 0) {
            newBadgesContainer.innerHTML = results.newBadges.map(badge =>
                `<div class="badge-item">
                    <div class="badge-icon">${badge.icon}</div>
                    <div class="badge-name">${badge.name}</div>
                </div>`
            ).join('');
            showElement(badgeNotification);
        } else {
            hideElement(badgeNotification);
        }

        // Show wrong answers if any
        const wrongAnswersSection = document.getElementById('wrong-answers-section');
        const wrongAnswersList = document.getElementById('wrong-answers-list');

        if (results.wrongAnswers.length > 0) {
            wrongAnswersList.innerHTML = results.wrongAnswers.map(wa =>
                `<div class="wrong-answer-item">
                    <div class="question">${wa.question}</div>
                    <div class="answer">正解: ${wa.correctAnswer}</div>
                </div>`
            ).join('');
            showElement(wrongAnswersSection);
        } else {
            hideElement(wrongAnswersSection);
        }

        // Show results modal
        const modal = document.getElementById('results-modal');
        modal.classList.add('active');

        // Update user status
        this.updateUserStatus();
    }

    /**
     * Close results modal
     */
    closeResultsModal() {
        const modal = document.getElementById('results-modal');
        modal.classList.remove('active');
    }

    /**
     * Show encyclopedia screen
     */
    showEncyclopedia() {
        this.showScreen('encyclopedia-screen');
        this.displayFigures();
    }

    /**
     * Display figures in encyclopedia
     * @param {Array} figuresToDisplay - Figures to display (optional)
     */
    displayFigures(figuresToDisplay = null) {
        const figures = figuresToDisplay || this.figures;
        const grid = document.getElementById('figures-grid');
        grid.innerHTML = '';

        figures.forEach(figure => {
            const isUnlocked = this.userData.unlockedFigures.includes(figure.id);
            const card = this.createFigureCard(figure, isUnlocked);
            grid.appendChild(card);
        });
    }

    /**
     * Create a figure card element
     * @param {Object} figure - Figure data
     * @param {boolean} isUnlocked - Whether figure is unlocked
     * @returns {HTMLElement} Figure card element
     */
    createFigureCard(figure, isUnlocked) {
        const card = document.createElement('div');
        card.className = `figure-card ${isUnlocked ? '' : 'locked'}`;

        if (isUnlocked) {
            card.addEventListener('click', () => this.showFigureDetail(figure));
        }

        card.innerHTML = `
            <img class="figure-portrait" src="${isUnlocked ? figure.portrait : 'images/portraits/locked.png'}" 
                 alt="${isUnlocked ? figure.name : '???'}" 
                 onerror="this.src='images/portraits/placeholder.png'">
            <div class="figure-card-content">
                <div class="figure-name">${isUnlocked ? figure.name : '???'}</div>
                <div class="figure-category-badge">${this.getCategoryName(figure.category)}</div>
            </div>
        `;

        return card;
    }

    /**
     * Get category name in Japanese
     * @param {string} category - Category ID
     * @returns {string} Category name
     */
    getCategoryName(category) {
        const names = {
            scientist: '科学者',
            artist: '芸術家',
            politician: '政治家',
            inventor: '発明家',
            philosopher: '思想家',
            explorer: '探検家'
        };
        return names[category] || category;
    }

    /**
     * Show figure detail modal
     * @param {Object} figure - Figure data
     */
    showFigureDetail(figure) {
        document.getElementById('detail-portrait').src = figure.portrait;
        document.getElementById('detail-name').textContent = figure.name;
        document.getElementById('detail-dates').textContent = `${figure.birth} - ${figure.death}`;
        document.getElementById('detail-country').textContent = figure.country;
        document.getElementById('detail-category').textContent = this.getCategoryName(figure.category);

        const achievementsList = document.getElementById('detail-achievements');
        achievementsList.innerHTML = figure.achievements.map(a => `<li>${a}</li>`).join('');

        const quotesDiv = document.getElementById('detail-quotes');
        quotesDiv.innerHTML = figure.quotes.map(q => `<p>"${q}"</p>`).join('');

        document.getElementById('detail-description').textContent = figure.description;

        const modal = document.getElementById('figure-detail-modal');
        modal.classList.add('active');
    }

    /**
     * Close figure detail modal
     */
    closeFigureDetailModal() {
        const modal = document.getElementById('figure-detail-modal');
        modal.classList.remove('active');
    }

    /**
     * Filter figures by category
     * @param {string} category - Category to filter
     */
    filterFigures(category) {
        if (category === 'all') {
            this.displayFigures();
        } else {
            const filtered = this.figures.filter(f => f.category === category);
            this.displayFigures(filtered);
        }
    }

    /**
     * Search figures by name
     * @param {string} query - Search query
     */
    searchFigures(query) {
        if (!query.trim()) {
            this.displayFigures();
            return;
        }

        const filtered = this.figures.filter(f =>
            f.name.toLowerCase().includes(query.toLowerCase()) ||
            f.nameEn.toLowerCase().includes(query.toLowerCase())
        );
        this.displayFigures(filtered);
    }

    /**
     * Show statistics screen
     */
    showStatistics() {
        this.showScreen('statistics-screen');
        this.displayStatistics();
    }

    /**
     * Display statistics
     */
    displayStatistics() {
        // Update overall stats
        document.getElementById('stat-accuracy').textContent =
            `${this.userData.statistics.accuracyRate}%`;
        document.getElementById('stat-figures-learned').textContent =
            this.userData.unlockedFigures.length;
        document.getElementById('stat-total-questions').textContent =
            this.userData.statistics.totalQuestions;

        // Display badges
        this.displayBadges();

        // Display category stats
        this.displayCategoryStats();
    }

    /**
     * Display badges
     */
    displayBadges() {
        const badgesGrid = document.getElementById('badges-grid');
        const allBadges = gamification.getAllBadges();

        badgesGrid.innerHTML = allBadges.map(badge => `
            <div class="badge-item ${badge.unlocked ? '' : 'locked'}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
            </div>
        `).join('');
    }

    /**
     * Display category statistics
     */
    displayCategoryStats() {
        const categoryStatsList = document.getElementById('category-stats-list');
        const categoryStats = this.userData.statistics.categoryStats;

        const categories = ['scientist', 'artist', 'politician', 'inventor', 'philosopher'];

        categoryStatsList.innerHTML = categories.map(category => {
            const stats = categoryStats[category] || { total: 0, correct: 0 };
            const accuracy = stats.total > 0 ? calculatePercentage(stats.correct, stats.total) : 0;

            return `
                <div class="category-stat-item">
                    <div class="category-stat-header">
                        <span class="category-name">${this.getCategoryName(category)}</span>
                        <span class="category-accuracy">${accuracy}%</span>
                    </div>
                    <div class="category-progress-bar">
                        <div class="category-progress-fill" style="width: ${accuracy}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Start daily challenge
     */
    startDailyChallenge() {
        // For now, just start a random difficulty quiz
        const difficulties = ['beginner', 'intermediate', 'advanced'];
        const randomDifficulty = getRandomElement(difficulties);
        this.startQuiz(randomDifficulty);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
