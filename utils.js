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

// Platform identifiers
const PLATFORM_CHATGPT = 'chatgpt';
const PLATFORM_GEMINI = 'gemini';
const PLATFORM_CLAUDE = 'claude';
const PLATFORM_PERPLEXITY = 'perplexity';

/**
 * Detects the current platform based on hostname.
 * @returns {string} The platform identifier.
 */
function getCurrentPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('gemini.google.com')) {
    return PLATFORM_GEMINI;
  }
  if (hostname.includes('claude.ai')) {
    return PLATFORM_CLAUDE;
  }
  if (hostname.includes('perplexity.ai')) {
    return PLATFORM_PERPLEXITY;
  }
  return PLATFORM_CHATGPT;
}

/**
 * Extracts the conversation ID from the current URL.
 * Supports ChatGPT (/c/{id}), Gemini (/app/{id}), Claude (/chat/{id}), and Perplexity (/search/{id}) URL patterns.
 * @returns {string|null} The conversation ID or null.
 */
function getConversationId() {
  const parts = window.location.pathname.split('/');
  const platform = getCurrentPlatform();

  if (platform === PLATFORM_GEMINI) {
    // Gemini URL pattern: /app/{conversation_id}
    if (parts.length >= 2 && parts[1] === 'app' && parts[2]) {
      const id = parts[2];
      return id && id.length > 5 ? id : null;
    }
  } else if (platform === PLATFORM_CLAUDE) {
    // Claude URL pattern: /chat/{conversation_id}
    if (parts.length >= 2 && parts[1] === 'chat' && parts[2]) {
      const id = parts[2];
      return id && id.length > 5 ? id : null;
    }
  } else if (platform === PLATFORM_PERPLEXITY) {
    // Perplexity URL pattern: /search/{conversation_id} or /page/{id}
    if (parts.length >= 2 && (parts[1] === 'search' || parts[1] === 'page') && parts[2]) {
      const id = parts[2];
      return id && id.length > 5 ? id : null;
    }
  } else {
    // ChatGPT URL pattern: /c/{conversation_id}
    if (parts.length > 2 && parts[parts.length - 2] === 'c') {
      const id = parts[parts.length - 1];
      return id && id.length > 5 ? id : null;
    }
  }
  return null;
}

/**
 * Extracts the conversation title from the sidebar.
 * Looks for the active conversation.
 * ChatGPT: uses data-active attribute
 * Gemini: uses 'selected' class
 * Claude: uses !bg-bg-300 class
 * Perplexity: uses first 8-9 words of first prompt
 * @returns {string|null} The conversation title or null.
 */
function getConversationTitle() {
  const platform = getCurrentPlatform();

  if (platform === PLATFORM_CHATGPT) {
    // Find the active chat link (has data-active attribute)
    const activeLink = document.querySelector('nav[aria-label="Chat history"] a[data-active]');
    if (activeLink) {
      // Try to get title from the title attribute first
      const titleDiv = activeLink.querySelector('.truncate[title]');
      if (titleDiv && titleDiv.title) {
        return titleDiv.title;
      }
      // Fallback: get text from span
      const span = activeLink.querySelector('span[dir="auto"]');
      if (span && span.textContent) {
        return span.textContent.trim();
      }
    }
  } else if (platform === PLATFORM_GEMINI) {
    // Gemini: Find the selected conversation link (has 'selected' class)
    const activeLink = document.querySelector('a[href^="/app/"].selected');
    if (activeLink) {
      // Get title from .conversation-title div
      const titleDiv = activeLink.querySelector('.conversation-title');
      if (titleDiv && titleDiv.textContent) {
        return titleDiv.textContent.trim();
      }
    }
  } else if (platform === PLATFORM_CLAUDE) {
    // Claude: Find the active conversation link (has !bg-bg-300 class)
    const activeLink = document.querySelector('a[href^="/chat/"].\\!bg-bg-300');
    if (activeLink) {
      // Get title from span.truncate
      const titleSpan = activeLink.querySelector('span.truncate');
      if (titleSpan && titleSpan.textContent) {
        return titleSpan.textContent.trim();
      }
    }
  } else if (platform === PLATFORM_PERPLEXITY) {
    // Perplexity: Title is first 8-9 words of the first prompt
    // Find the first user query element (span.select-text)
    const firstQuery = document.querySelector('span.select-text');
    if (firstQuery && firstQuery.textContent) {
      const words = firstQuery.textContent.trim().split(/\s+/).slice(0, 9);
      return words.join(' ') + (words.length >= 9 ? '...' : '');
    }
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

// --- UUID HELPERS (for cloud sync) ---

/**
 * Gets the user's UUID from sync storage.
 * @returns {Promise<string|null>} The UUID or null if not set.
 */
async function getUUID() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['userUUID'], (data) => {
      resolve(data.userUUID || null);
    });
  });
}

/**
 * Requests UUID from background script (ensures it exists).
 * If UUID doesn't exist, the background script will create one.
 * @returns {Promise<string>} The user's UUID.
 */
async function ensureUUID() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_UUID' }, (response) => {
      resolve(response.uuid);
    });
  });
}