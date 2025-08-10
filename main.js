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
  chrome.storage.local.get([convoId], (data) => {
    currentPrompts = data[convoId] || [];
    updatePromptsDisplay(currentPrompts);
  });
}

/**
 * Scans the CURRENT page for user prompts and updates storage if they change.
 * This function is now simpler and only focuses on the active conversation.
 */
function checkForNewPrompts() {
  const convoId = getConversationId();
  
  // If we are not in a conversation, do nothing.
  if (!convoId) {
    // If the UI is not showing the empty state, clear it.
    if (!document.querySelector('#promptList .empty-state')) {
        currentPrompts = [];
        updatePromptsDisplay([]);
    }
    return;
  }

  // If the conversation ID has changed, load the new data.
  if (convoId !== currentConversationId) {
    currentConversationId = convoId;
    loadPromptsFromStorage(convoId);
    return;
  }
  
  // Scan the page for prompt elements.
  const userMessages = document.querySelectorAll('div[data-message-author-role="user"]');
  const foundPrompts = [];
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

  // Update storage and UI only if prompts have actually changed.
  if (JSON.stringify(foundPrompts) !== JSON.stringify(currentPrompts)) {
    currentPrompts = foundPrompts;
    chrome.storage.local.set({ [convoId]: currentPrompts });
    updatePromptsDisplay(currentPrompts);
  }
}

/**
 * **NEW & ROBUST DELETION LOGIC**
 * Takes a snapshot of the conversation list, compares it to the last known snapshot,
 * and removes any missing (deleted) conversations from storage.
 */
function updateAndCheckForDeletedConversations() {
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
            console.log(`Prompt Tracker: Deletion detected for conversation ${oldId}. Cleaning up storage.`);
            chrome.storage.local.remove(oldId);
        }
    }

    // Update the master list of known IDs.
    knownConversationIds = newIdSet;
}

/**
 * Sets up MutationObservers to watch for DOM changes.
 */
function startObservers() {
  // Observer 1: Watches the whole page for new prompts being added.
  const promptObserver = new MutationObserver(() => {
    // Use a debounce to prevent firing too rapidly.
    clearTimeout(promptObserver.debounce);
    promptObserver.debounce = setTimeout(checkForNewPrompts, 250);
  });
  promptObserver.observe(document.body, { childList: true, subtree: true });

  // Observer 2: Watches the chat history list for deletions.
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

/**
 * Main initialization function.
 */
function initialize() {
  // Load saved theme
  chrome.storage.local.get([THEME_STORAGE_KEY], (data) => {
    const savedTheme = data[THEME_STORAGE_KEY] || 'dark';

    // Inject UI elements
    injectSidebar();
    createToggleButton();
    createThemeToggle();

    // Apply theme
    applyTheme(savedTheme);

    // Attach event listeners for UI components
    attachCardListeners();
    window.addEventListener('resize', () => setTimeout(checkAndApplyResponsiveLogic, 100));
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && ['+', '-', '0'].includes(e.key)) {
        setTimeout(checkAndApplyResponsiveLogic, 100);
      }
    });

    // Start observers and run initial checks
    startObservers();
    setTimeout(() => {
        checkForNewPrompts(); // Run once to set the initial state of the sidebar.
        checkAndApplyResponsiveLogic();
    }, 1500);
  });
}

/**
 * A responsive check to manage sidebar visibility on narrow screens.
 */
function checkAndApplyResponsiveLogic() {
    const sidebar = document.getElementById('prompt-tracker-sidebar');
    const toggle = document.getElementById('prompt-sidebar-toggle');
    if (!sidebar || !toggle) return;

    const mainContent = document.querySelector('div[class*="react-scroll-to-bottom"]');
    const isOpen = sidebar.style.right === "15px";

    if (mainContent && mainContent.offsetWidth < 650 && isOpen) {
        handleToggleSidebar();
    }
}


// Ensure the DOM is ready before running the script.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}