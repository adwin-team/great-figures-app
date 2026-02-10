// ===================================
// Quiz Manager
// ===================================

class QuizManager {
    constructor() {
        this.questions = [];
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = [];
        this.consecutiveCorrect = 0;
        this.difficulty = 'beginner';
        this.isAnswered = false;
    }

    /**
     * Load questions from JSON file
     */
    async loadQuestions() {
        try {
            const response = await fetch('data/questions.json');
            const data = await response.json();
            this.questions = data.questions;
            debug('Questions loaded', this.questions.length);
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('問題データの読み込みに失敗しました。');
        }
    }

    /**
     * Start a new quiz
     * @param {string} difficulty - Quiz difficulty
     */
    startQuiz(difficulty) {
        this.difficulty = difficulty;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = [];
        this.consecutiveCorrect = 0;

        // Select 10 questions for this difficulty
        this.currentQuestions = this.selectQuestions(difficulty, 10);

        if (this.currentQuestions.length === 0) {
            alert('この難易度の問題がありません。');
            return false;
        }

        debug(`Quiz started: ${difficulty}, ${this.currentQuestions.length} questions`);
        return true;
    }

    /**
     * Select random questions for difficulty
     * @param {string} difficulty - Difficulty level
     * @param {number} count - Number of questions
     * @returns {Array} Selected questions
     */
    selectQuestions(difficulty, count) {
        const availableQuestions = this.questions.filter(q => q.difficulty === difficulty);
        const shuffled = shuffleArray(availableQuestions);
        return shuffled.slice(0, count);
    }

    /**
     * Get current question
     * @returns {Object} Current question
     */
    getCurrentQuestion() {
        return this.currentQuestions[this.currentQuestionIndex];
    }

    /**
     * Check if answer is correct
     * @param {number} selectedOption - Selected option index
     * @returns {Object} Result information
     */
    checkAnswer(selectedOption) {
        if (this.isAnswered) return null;

        const question = this.getCurrentQuestion();
        const isCorrect = selectedOption === question.correctAnswer;

        this.isAnswered = true;

        if (isCorrect) {
            this.correctAnswers++;
            this.consecutiveCorrect++;

            // Calculate points
            const points = gamification.calculatePoints(
                this.difficulty,
                true,
                this.consecutiveCorrect
            );
            this.score += points;

            debug(`Correct! Points: ${points}, Consecutive: ${this.consecutiveCorrect}`);
        } else {
            this.consecutiveCorrect = 0;
            this.wrongAnswers.push({
                question: question.question,
                correctAnswer: question.options[question.correctAnswer],
                userAnswer: question.options[selectedOption]
            });

            debug('Incorrect');
        }

        return {
            isCorrect,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            points: isCorrect ? gamification.calculatePoints(
                this.difficulty,
                true,
                this.consecutiveCorrect
            ) : 0
        };
    }

    /**
     * Move to next question
     * @returns {boolean} True if there are more questions
     */
    nextQuestion() {
        this.isAnswered = false;
        this.currentQuestionIndex++;
        return this.currentQuestionIndex < this.currentQuestions.length;
    }

    /**
     * Get quiz results
     * @returns {Object} Quiz results
     */
    getResults() {
        const totalQuestions = this.currentQuestions.length;
        const accuracyRate = calculatePercentage(this.correctAnswers, totalQuestions);

        // Add experience (same as points for now)
        const levelUpInfo = gamification.addExperience(this.score);

        // Update statistics
        storage.updateStatistics({
            totalQuestions,
            correctAnswers: this.correctAnswers
        });

        // Update streak
        const newStreak = storage.updateStreak();

        // Check for new badges
        const newBadges = gamification.checkBadgeConditions({
            correctAnswers: this.correctAnswers,
            totalQuestions,
            difficulty: this.difficulty
        });

        // Unlock figures based on questions answered
        this.unlockFiguresFromQuiz();

        // Save quiz to history
        storage.addQuizToHistory({
            difficulty: this.difficulty,
            score: this.score,
            correctAnswers: this.correctAnswers,
            totalQuestions,
            accuracyRate
        });

        return {
            score: this.score,
            correctAnswers: this.correctAnswers,
            totalQuestions,
            accuracyRate,
            wrongAnswers: this.wrongAnswers,
            levelUpInfo,
            newBadges,
            newStreak
        };
    }

    /**
     * Unlock figures based on quiz questions
     */
    unlockFiguresFromQuiz() {
        const figureIds = this.currentQuestions.map(q => q.figureId);
        const uniqueFigureIds = [...new Set(figureIds)];

        uniqueFigureIds.forEach(figureId => {
            storage.unlockFigure(figureId);
        });
    }

    /**
     * Get progress percentage
     * @returns {number} Progress percentage
     */
    getProgress() {
        return calculatePercentage(this.currentQuestionIndex + 1, this.currentQuestions.length);
    }
}

// Create global instance
const quiz = new QuizManager();
