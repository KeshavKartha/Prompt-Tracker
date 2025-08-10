/**
 * @file Contains shared state, constants, and utility functions.
 */

// --- STATE VARIABLES ---
let currentPrompts = [];
let currentConversationId = null;
let currentTheme = 'dark'; // Default theme
const promptIdMap = new WeakMap(); // Maps DOM elements to prompt IDs
let knownConversationIds = new Set(); // **NEW:** Holds a snapshot of all chat IDs from the sidebar.

// --- CONSTANTS ---
const SIDEBAR_DEFAULT_WIDTH = 260;
let sidebarHiddenRightPos = `-${SIDEBAR_DEFAULT_WIDTH + 20}px`;
const THEME_STORAGE_KEY = 'promptTrackerTheme';

/**
 * Extracts the conversation ID from the current URL.
 * @returns {string|null} The conversation ID or null.
 */
function getConversationId() {
  const parts = window.location.pathname.split('/');
  if (parts.length > 2 && parts[parts.length - 2] === 'c') {
    const id = parts[parts.length - 1];
    return id && id.length > 5 ? id : null;
  }
  return null;
}

/**
 * Generates a unique ID for a prompt element.
 * @returns {string} A unique ID string.
 */
function generatePromptId() {
  return 'prompt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}