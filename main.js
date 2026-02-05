/**
 * @file The main entry point for the Prompt Tracker extension.
 * Initializes the UI, loads data, and sets up observers.
 */

/**
 * Loads prompts for a given conversation ID from chrome.storage.
 * @param {string} convoId The ID of the conversation.
 */
function loadPromptsFromStorage(convoId) {
  if (!convoId) return;
  chrome.storage.local.get([convoId], async (data) => {
    currentPrompts = data[convoId] || [];
    await updatePromptsDisplay(currentPrompts);
  });
}

/**
 * Scans the CURRENT page for user prompts and updates storage if they change.
 * Supports both ChatGPT and Gemini platforms.
 */
async function checkForNewPrompts() {
  const convoId = getConversationId();

  // If we are not in a conversation, do nothing.
  if (!convoId) {
    // If the UI is not showing the empty state, clear it.
    if (!document.querySelector('#promptList .empty-state')) {
        currentPrompts = [];
        await updatePromptsDisplay([]);
    }
    return;
  }

  // If the conversation ID has changed, load the new data.
  if (convoId !== currentConversationId) {
    currentConversationId = convoId;
    loadPromptsFromStorage(convoId);
    return;
  }

  const platform = getCurrentPlatform();
  const foundPrompts = [];

  if (platform === PLATFORM_GEMINI) {
    // Gemini: prompts are in user-query elements
    const userQueries = document.querySelectorAll('user-query');
    for (const query of userQueries) {
      // Extract text from .query-text or .query-text-line
      const textEl = query.querySelector('.query-text-line') || query.querySelector('.query-text');
      const promptText = textEl ? textEl.innerText.trim() : '';
      if (!promptText) continue;

      let promptId = query.dataset.promptId || promptIdMap.get(query);
      if (!promptId) {
        promptId = generatePromptId();
        query.dataset.promptId = promptId;
        promptIdMap.set(query, promptId);
      }
      foundPrompts.push({ id: promptId, content: promptText });
    }
  } else {
    // ChatGPT: prompts are in divs with data-message-author-role="user"
    const userMessages = document.querySelectorAll('div[data-message-author-role="user"]');
    for (const msg of userMessages) {
      const promptText = msg.innerText.trim();
      if (!promptText) continue;

      let promptId = msg.dataset.promptId || promptIdMap.get(msg);
      if (!promptId) {
        promptId = generatePromptId();
        msg.dataset.promptId = promptId;
        promptIdMap.set(msg, promptId);
      }
      foundPrompts.push({ id: promptId, content: promptText });
    }
  }

  // Update storage and UI only if prompts have actually changed.
  if (JSON.stringify(foundPrompts) !== JSON.stringify(currentPrompts)) {
    currentPrompts = foundPrompts;
    chrome.storage.local.set({ [convoId]: currentPrompts }, () => {
      // Trigger cloud sync with title
      const conversationTitle = getConversationTitle();
      chrome.runtime.sendMessage({
        type: 'SYNC_CONVERSATION',
        data: {
          platform: getCurrentPlatform(),
          conversationId: convoId,
          conversationTitle: conversationTitle,
          prompts: currentPrompts
        }
      });
    });
    await updatePromptsDisplay(currentPrompts);
  }
}

/**
 * **NEW & ROBUST DELETION LOGIC**
 * Takes a snapshot of the conversation list, compares it to the last known snapshot,
 * and removes any missing (deleted) conversations from storage.
 * Only applies to ChatGPT (Gemini has a different sidebar structure).
 */
function updateAndCheckForDeletedConversations() {
    if (getCurrentPlatform() !== PLATFORM_CHATGPT) return;

    const chatLinks = document.querySelectorAll('nav[aria-label="Chat history"] a');
    if (chatLinks.length === 0 && knownConversationIds.size === 0) return; // Nothing to do yet.

    const newIdSet = new Set();
    chatLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/c/')) {
            newIdSet.add(href.substring(3));
        }
    });

    // Compare the old set with the new set to find deleted items.
    for (const oldId of knownConversationIds) {
        if (!newIdSet.has(oldId)) {
            chrome.storage.local.remove(oldId, () => {
              // Trigger cloud deletion
              chrome.runtime.sendMessage({
                type: 'DELETE_CONVERSATION',
                data: {
                  platform: PLATFORM_CHATGPT,
                  conversationId: oldId
                }
              });
            });
        }
    }

    // Update the master list of known IDs.
    knownConversationIds = newIdSet;
}

/**
 * Sets up MutationObservers to watch for DOM changes.
 * Adapts to the current platform (ChatGPT or Gemini).
 */
function startObservers() {
  const platform = getCurrentPlatform();

  // Observer 1: Watches for new prompts being added.
  const promptObserver = new MutationObserver(() => {
    // Use a shorter debounce for more responsive updates
    clearTimeout(promptObserver.debounce);
    promptObserver.debounce = setTimeout(checkForNewPrompts, 100);
  });

  // Find the main content container based on platform
  let mainContent;
  if (platform === PLATFORM_GEMINI) {
    mainContent = document.querySelector('chat-window') || document.querySelector('main') || document.body;
  } else {
    mainContent = document.querySelector('main') || document.body;
  }

  promptObserver.observe(mainContent, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });

  // Observer 2: Watch for immediate changes in conversation area
  let conversationContainer;
  if (platform === PLATFORM_GEMINI) {
    conversationContainer = document.querySelector('chat-window') || document.querySelector('[role="main"]');
  } else {
    conversationContainer = document.querySelector('[role="main"]') || document.querySelector('main');
  }

  if (conversationContainer) {
    const conversationObserver = new MutationObserver(() => {
      clearTimeout(conversationObserver.debounce);
      conversationObserver.debounce = setTimeout(checkForNewPrompts, 50);
    });
    conversationObserver.observe(conversationContainer, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  // Observer 3: Watches the chat history list for deletions (ChatGPT only).
  if (platform === PLATFORM_CHATGPT) {
    const chatListContainer = document.querySelector('nav[aria-label="Chat history"]');
    if (chatListContainer) {
      const chatListObserver = new MutationObserver(updateAndCheckForDeletedConversations);
      chatListObserver.observe(chatListContainer, { childList: true, subtree: true });
      // Run it once initially to populate our list.
      updateAndCheckForDeletedConversations();
    } else {
      // If the list isn't ready, try again in a moment.
      setTimeout(startObservers, 1000);
    }
  }
}

/**
 * Main initialization function.
 */
async function initialize() {
  try {
    // Load saved theme
    chrome.storage.local.get([THEME_STORAGE_KEY], async (data) => {
      const savedTheme = data[THEME_STORAGE_KEY] || 'dark';

      // Initialize the complete UI
      const uiInitialized = await initializeExtensionUI();
      if (!uiInitialized) {
        console.error('Prompt Tracker: UI initialization failed, retrying in 2 seconds...');
        setTimeout(initialize, 2000);
        return;
      }

      // Apply theme
      await applyTheme(savedTheme);

      // Attach event listeners for UI components
      attachCardListeners();
      window.addEventListener('resize', () => setTimeout(checkAndApplyResponsiveLogic, 100));
      document.addEventListener('keydown', (e) => {
        const isModifierKey = e.ctrlKey || e.metaKey;
        if (isModifierKey && ['+', '-', '0', '='].includes(e.key)) {
          setTimeout(checkAndApplyResponsiveLogic, 100);
        }
      });

      // Start observers and run initial checks
      startObservers();
      setTimeout(() => {
          checkForNewPrompts();
          checkAndApplyResponsiveLogic();
      }, 1500);
    });
  } catch (error) {
    console.error('Prompt Tracker: Main initialization failed:', error);
    // Retry initialization after a delay
    setTimeout(initialize, 3000);
  }
}

/**
 * A responsive check to manage sidebar visibility on narrow screens.
 */
function checkAndApplyResponsiveLogic() {
    const sidebar = document.getElementById('prompt-tracker-sidebar');
    const toggle = document.getElementById('prompt-sidebar-toggle');
    if (!sidebar || !toggle) return;

    const platform = getCurrentPlatform();
    let mainContent;
    if (platform === PLATFORM_GEMINI) {
      mainContent = document.querySelector('chat-window') || document.querySelector('[role="main"]');
    } else {
      mainContent = document.querySelector('div[class*="react-scroll-to-bottom"]');
    }

    const isOpen = sidebar.style.right === "15px";

    if (mainContent && mainContent.offsetWidth < 650 && isOpen) {
        handleCloseSidebar();
    }
}


// Ensure the DOM is ready before running the script.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}