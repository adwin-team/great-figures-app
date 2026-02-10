// ===================================
// Utility Functions
// ===================================

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get a random element from an array
 * @param {Array} array - Source array
 * @returns {*} Random element
 */
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD
 * @returns {string} Today's date
 */
function getToday() {
    return formatDate(new Date());
}

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Clamp a number between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Delay execution
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Show element with animation
 * @param {HTMLElement} element - Element to show
 * @param {string} animationClass - Animation class to add
 */
function showElement(element, animationClass = 'animate-fade-in') {
    element.style.display = 'block';
    element.classList.add(animationClass);
}

/**
 * Hide element
 * @param {HTMLElement} element - Element to hide
 */
function hideElement(element) {
    element.style.display = 'none';
}

/**
 * Toggle element visibility
 * @param {HTMLElement} element - Element to toggle
 */
function toggleElement(element) {
    if (element.style.display === 'none') {
        showElement(element);
    } else {
        hideElement(element);
    }
}

/**
 * Add class with animation
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class to add
 * @param {number} duration - Duration in ms before removing class
 */
async function addTemporaryClass(element, className, duration = 1000) {
    element.classList.add(className);
    await delay(duration);
    element.classList.remove(className);
}

/**
 * Smooth scroll to element
 * @param {HTMLElement} element - Target element
 */
function scrollToElement(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Log debug message
 * @param {string} message - Message to log
 * @param {*} data - Additional data
 */
function debug(message, data = null) {
    if (window.DEBUG_MODE) {
        console.log(`[DEBUG] ${message}`, data);
    }
}

// Enable debug mode (set to false in production)
window.DEBUG_MODE = true;
