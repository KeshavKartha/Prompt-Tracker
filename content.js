/**
 * Prompt Tracker for ChatGPT
 *
 * This script injects a sidebar into the ChatGPT interface to track and manage prompts within a conversation.
 * It uses a direct DIV injection method and robust, width-based responsive logic.
 * Features manual light/dark mode theme toggling.
 */

// ===================================================================================
// ===== STATE & HELPERS =============================================================
// ===================================================================================

let currentPrompts = [];
let currentConversationId = null;
const promptIdMap = new WeakMap();
let sidebarHiddenRightPos = "-280px";
const sidebarDefaultWidth = 260;

// ===== NEW THEME STATE MANAGEMENT =====
let currentTheme = 'dark'; // Default theme: 'dark' or 'light'
const themeStorageKey = 'promptTrackerTheme';
// The isDarkModeActive() function has been removed.

/**
 * Extracts the conversation ID from the current URL.
 * @returns {string|null} The conversation ID or null if not on a conversation page.
 */
function getConversationId() {
  const parts = window.location.pathname.split('/');
  const id = parts.includes("c") ? parts.pop() : null;
  return id && id.length > 5 ? id : null;
}

/**
 * Generates a unique ID for a prompt element.
 * @returns {string} A unique ID string.
 */
function generatePromptId() {
  return 'prompt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

// ===================================================================================
// ===== THEME MANAGEMENT (NEW) ======================================================
// ===================================================================================

/**
 * Applies the selected theme to all UI elements.
 * @param {string} theme - The theme to apply, either 'dark' or 'light'.
 */
function applyTheme(theme) {
  currentTheme = theme;
  const isDark = theme === 'dark';

  // ===== CORRECTED LOGIC =====
  // Apply theme class to the main document body for global access.
  // This ensures CSS rules can target all UI elements, including the external buttons.
  document.body.classList.remove('theme-dark', 'theme-light');
  document.body.classList.add(isDark ? 'theme-dark' : 'theme-light');

  const mainToggle = document.getElementById("prompt-sidebar-toggle");
  const themeToggle = document.getElementById("theme-toggle-button");
  
  // Update the theme toggle button's icon and base style
  if (themeToggle) {
    themeToggle.innerHTML = isDark 
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>` // Sun icon
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`; // Moon icon
    themeToggle.style.background = isDark ? "rgba(40,40,40,0.95)" : "rgba(255,255,255,0.95)";
    themeToggle.style.color = isDark ? "#e0e0e0" : "#374151";
    themeToggle.style.border = `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`;
  }
  
  // Manually update the main toggle button's styles, as they depend on both theme and open/closed state
  if (mainToggle) {
    const isOpen = mainToggle.classList.contains('prompt-toggle-close');
    if(isOpen) {
        mainToggle.style.background = isDark ? "rgba(40,40,40,0.95)" : "rgba(255,255,255,0.95)";
        mainToggle.style.color = isDark ? "#e0e0e0" : "#374151";
        mainToggle.style.border = `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`;
    } else {
        mainToggle.style.background = isDark ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)';
        mainToggle.style.color = isDark ? '#e0e0e0' : '#374151';
        mainToggle.style.border = `1px solid ${isDark ? 'rgba(80,80,80,0.3)' : 'rgba(0,0,0,0.08)'}`;
    }
  }
}

// ===================================================================================
// ===== UI INJECTION & MANAGEMENT ===================================================
// ===================================================================================

/**
 * Injects the sidebar container and its associated styles into the page.
 */
function injectSidebar() {
  if (document.getElementById("prompt-tracker-sidebar")) return;

  const sidebar = document.createElement("div");
  sidebar.id = "prompt-tracker-sidebar";
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3>Previous Prompts</h3>
      <div class="prompt-count"><span id="promptCount">0</span> prompts</div>
    </div>
    <div id="promptList" class="prompt-list-container"></div>
    <div id="copyToast" class="copy-toast"><span>✓ Copied to clipboard!</span></div>
  `;
  
  sidebar.style.cssText = `
    position: fixed;
    top: 0;
    right: ${sidebarHiddenRightPos};
    width: ${sidebarDefaultWidth}px;
    height: 100%;
    background: transparent;
    border: none;
    z-index: 9999;
    pointer-events: none;
    /* MODIFIED: Changed easing to ease-out for a more responsive start */
    transition: all 0.3s ease-out;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12.5px;
  `;
  
  if (!document.getElementById('prompt-tracker-styles')) {
    const style = document.createElement('style');
    style.id = 'prompt-tracker-styles';
    style.textContent = `
      body.theme-dark #prompt-tracker-sidebar { color: #e0e0e0; }
      body.theme-light #prompt-tracker-sidebar { color: #1f2937; }

      body.theme-dark #prompt-sidebar-toggle:not(.prompt-toggle-close):hover { background: rgba(55, 55, 55, 0.95) !important; }
      body.theme-light #prompt-sidebar-toggle:not(.prompt-toggle-close):hover { background: rgba(240, 240, 240, 0.95) !important; }
      
      body.theme-dark #theme-toggle-button:hover { background: rgba(70, 70, 70, 0.95) !important; }
      body.theme-light #theme-toggle-button:hover { background: rgba(230, 230, 230, 0.95) !important; }
      
      #theme-toggle-button:hover {
        transform: scale(1.1);
      }

      #prompt-sidebar-toggle.prompt-toggle-close:hover {
        transform: scale(1.05) rotate(90deg);
        background-color: rgba(239, 68, 68, 0.9) !important;
        border-color: rgba(239, 68, 68, 0.9) !important;
      }
      
      #prompt-tracker-sidebar .sidebar-header {
        border-radius: 8px; margin: 12px; margin-bottom: 8px; padding: 14px;
        position: sticky; top: 12px; z-index: 10; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      }
      body.theme-dark .sidebar-header { background: #121212; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
      body.theme-light .sidebar-header { background: rgba(248,248,248,0.9); border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
      
      .sidebar-header h3 { margin: 0 0 4px 0; font-size: 15px; font-weight: 600; font-family: 'Figtree', 'Inter', sans-serif; }
      body.theme-dark .sidebar-header h3 { color: #f0f0f0; }
      body.theme-light .sidebar-header h3 { color: #111827; }

      .prompt-count { font-size: 11.5px; font-weight: 500; }
      body.theme-dark .prompt-count { color: #a0a0a0; }
      body.theme-light .prompt-count { color: #6b7280; }
      
      .prompt-list-container { padding: 0 12px 12px 12px; display: flex; flex-direction: column; gap: 12px; height: calc(100vh - 90px); overflow-y: auto; }
      .prompt-list-container::-webkit-scrollbar { width: 6px; }
      .prompt-list-container::-webkit-scrollbar-track { background: transparent; }
      body.theme-dark .prompt-list-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
      body.theme-light .prompt-list-container::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); }
      body.theme-dark .prompt-list-container::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.35); }
      body.theme-light .prompt-list-container::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.35); }
      
      .empty-state { text-align: center; padding: 40px 20px; border-radius: 8px; margin: 0 12px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      body.theme-dark .empty-state { color: #9ca3af; background: rgba(30,30,30,0.9); border: 1px solid rgba(255,255,255,0.08); }
      body.theme-light .empty-state { color: #6b7280; background: rgba(248,248,248,0.9); border: 1px solid rgba(0,0,0,0.05); }
      .empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.6; }
      .empty-text { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
      body.theme-dark .empty-text { color: #d1d5db; }
      body.theme-light .empty-text { color: #374151; }
      .empty-subtext { font-size: 12.5px; margin-bottom: 16px; }
      body.theme-dark .empty-subtext { color: #6b7280; }
      body.theme-light .empty-subtext { color: #9ca3af; }
      .empty-refresh-hint { font-size: 11.5px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 6px; padding: 8px 12px; margin-top: 12px; font-style: italic; }
      body.theme-dark .empty-refresh-hint { color: #60a5fa; }
      body.theme-light .empty-refresh-hint { color: #3b82f6; }

      .prompt-card { border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.15s ease; overflow: hidden; position: relative; min-height: 25px; display: flex; flex-direction: column; flex-shrink: 0; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      body.theme-dark .prompt-card { background: rgba(40,40,40,0.85); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
      body.theme-light .prompt-card { background: rgba(255,255,255,0.85); border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      body.theme-dark .prompt-card:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.12); background: rgba(45,45,45,0.9); }
      body.theme-light .prompt-card:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.1); border-color: rgba(0,0,0,0.08); background: rgba(255,255,255,0.9); }
      
      .prompt-content { font-family: 'Figtree', 'Inter', sans-serif; font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; position: relative; min-height: 20px; max-height: 100px; overflow: hidden; }
      body.theme-dark .prompt-content { color: #e0e0e0; }
      body.theme-light .prompt-content { color: #374151; }

      .prompt-content::before { content: attr(data-number) ". "; font-weight: 600; margin-right: 4px; }
      body.theme-dark .prompt-content::before { color: #a0a0a0; }
      body.theme-light .prompt-content::before { color: #888888; }
      
      .copy-btn { background: none; border: none; padding: 4px; border-radius: 4px; cursor: pointer; transition: all 0.15s ease; display: flex; align-items: center; justify-content: center; opacity: 0.7; }
      body.theme-dark .copy-btn { color: #a0a0a0; }
      body.theme-light .copy-btn { color: #6b7280; }
      body.theme-dark .copy-btn:hover { background: rgba(255,255,255,0.05); color: #e0e0e0; opacity: 1; }
      body.theme-light .copy-btn:hover { background: rgba(0,0,0,0.05); color: #374151; opacity: 1; }

      .copy-toast { position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; font-size: 12.5px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: translateY(100px); opacity: 0; transition: all 0.3s ease; z-index: 10000; }
      .copy-toast.show { transform: translateY(0); opacity: 1; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(sidebar);
  loadSidebarScript(sidebar);
  createToggleButton();
  createThemeToggle();
}

/**
 * Creates the floating toggle button to open/close the sidebar.
 */
function createToggleButton() {
  if (document.getElementById("prompt-sidebar-toggle")) return;

  const toggle = document.createElement("button");
  toggle.id = "prompt-sidebar-toggle";
  toggle.innerHTML = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"></path><path d="M8 12.5L10.5 15L16 9"></path><path d="M12 2V3.5"></path><path d="M12 20.5V22"></path><path d="M22 12H20.5"></path><path d="M3.5 12H2"></path><path d="M4.92893 4.92893L5.99999 6"></path><path d="M18 18L19.0711 19.0711"></path><path d="M19.0711 4.92893L18 6"></path><path d="M6 18L4.92893 19.0711"></path></svg>`;
  
  toggle.style.cssText = `
    position: fixed; 
    top: 54px; right: 20px;
    z-index: 99999;
    padding: 10px; 
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 10px; 
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    cursor: pointer; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    /* MODIFIED: Changed easing to ease-out */
    transition: all 0.2s ease-out;
  `;

  toggle.addEventListener("click", () => {
    const sidebar = document.getElementById("prompt-tracker-sidebar");
    const themeToggle = document.getElementById("theme-toggle-button");
    if (!sidebar) {
      injectSidebar();
      return;
    }
    const isOpen = sidebar.style.right === "15px";
    
    sidebar.style.right = isOpen ? sidebarHiddenRightPos : "15px"; 
    sidebar.style.pointerEvents = isOpen ? "none" : "auto";
    
    if (themeToggle) {
        themeToggle.style.right = isOpen ? '-100px' : '85px';
    }

    if (isOpen) {
      toggle.classList.remove('prompt-toggle-close');
      toggle.innerHTML = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"></path><path d="M8 12.5L10.5 15L16 9"></path><path d="M12 2V3.5"></path><path d="M12 20.5V22"></path><path d="M22 12H20.5"></path><path d="M3.5 12H2"></path><path d="M4.92893 4.92893L5.99999 6"></path><path d="M18 18L19.0711 19.0711"></path><path d="M19.0711 4.92893L18 6"></path><path d="M6 18L4.92893 19.0711"></path></svg>`;
      toggle.style.top = "54px";
      toggle.style.right = "20px";
      toggle.style.width = "38px";
      toggle.style.height = "38px";
      toggle.style.padding = "10px";
      toggle.style.borderRadius = "10px";
      toggle.style.transform = '';
    } else {
      toggle.classList.add('prompt-toggle-close');
      toggle.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      toggle.style.top = "22px";
      toggle.style.right = "40px";
      toggle.style.width = "30px";
      toggle.style.height = "30px";
      toggle.style.padding = "6px";
      toggle.style.borderRadius = "8px";
    }
    applyTheme(currentTheme);
  });

  document.body.appendChild(toggle);
}

/**
 * ===== NEW FUNCTION =====
 * Creates the theme toggle button, positioned next to the close ('X') button.
 */
/**
 * ===== NEW FUNCTION =====
 * Creates the theme toggle button, positioned next to the close ('X') button.
 */
function createThemeToggle() {
    if (document.getElementById("theme-toggle-button")) return;

    const themeToggle = document.createElement("button");
    themeToggle.id = "theme-toggle-button";
    themeToggle.title = "Toggle Theme";

    themeToggle.style.cssText = `
        position: fixed;
        top: 26px;
        right: -100px; 
        z-index: 99999;
        padding: 5px;
        width: 24px; height: 24px;
        display: flex;
        align-items: center; justify-content: center;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        cursor: pointer; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        /* MODIFIED: Changed easing to ease-out */
        transition: all 0.3s ease-out;
    `;

    themeToggle.addEventListener('click', () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        chrome.storage.local.set({ [themeStorageKey]: newTheme });
        applyTheme(newTheme);
    });

    document.body.appendChild(themeToggle);
}

// ===================================================================================
// ===== SIDEBAR SCRIPT LOGIC (Unchanged) ============================================
// ===================================================================================

function loadSidebarScript(sidebar) {
  const promptList = sidebar.querySelector('#promptList');
  const promptCountEl = sidebar.querySelector('#promptCount');
  const copyToast = sidebar.querySelector('#copyToast');

  sidebar.updatePromptsDisplay = function(prompts) {
    if (!promptList || !promptCountEl) return;
    promptCountEl.textContent = prompts.length;
    if (prompts.length === 0) {
      promptList.innerHTML = `<div class="empty-state"><div class="empty-icon">💭</div><div class="empty-text">No prompts yet</div><div class="empty-subtext">Start a conversation to see your prompts here</div><div class="empty-refresh-hint">💡 If prompts aren't showing, try refreshing the page</div></div>`;
      return;
    }
    promptList.innerHTML = prompts.map((prompt, index) => `
      <div class="prompt-card" data-target-prompt="${prompt.id}" title="Click to jump to this prompt">
        <div class="prompt-content ${prompt.content.length > 50 ? 'long' : ''}" data-number="${index + 1}">${prompt.content}</div>
        <div class="prompt-actions">
          <button class="copy-btn" title="Copy prompt" data-prompt="${encodeURIComponent(prompt.content)}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
      </div>`).join('');
    attachCardListeners();
  };
  
  function showCopyToast() {
    if (!copyToast) return;
    copyToast.classList.add('show');
    setTimeout(() => copyToast.classList.remove('show'), 2000);
  }

  function attachCardListeners() {
    sidebar.querySelectorAll('.prompt-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.copy-btn')) return;
        jumpToPrompt(card.dataset.targetPrompt);
      });
    });

    sidebar.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(decodeURIComponent(btn.dataset.prompt)).then(showCopyToast);
      });
    });
  }

  const convoId = getConversationId();
  if (convoId) {
    loadPromptsFromStorage(convoId);
  } else {
    sidebar.updatePromptsDisplay([]);
  }
}

function jumpToPrompt(promptId) {
    let promptElement = document.querySelector(`[data-prompt-id="${promptId}"]`);
    if (!promptElement) {
        const targetPrompt = currentPrompts.find(p => p.id === promptId);
        if (targetPrompt) {
            const allUserMessages = document.querySelectorAll('div[data-message-author-role="user"]');
            for (const msg of allUserMessages) {
                if (msg.innerText.trim() === targetPrompt.content) {
                    promptElement = msg;
                    msg.dataset.promptId = promptId;
                    promptIdMap.set(msg, promptId);
                    break;
                }
            }
        }
    }
  if (promptElement) {
    promptElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    promptElement.classList.add('prompt-highlight');
    promptElement.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
    promptElement.style.border = '2px solid rgba(59, 130, 246, 0.4)';
    promptElement.style.borderRadius = '8px';
    setTimeout(() => {
        promptElement.classList.remove('prompt-highlight');
        promptElement.style.backgroundColor = '';
        promptElement.style.border = '';
        promptElement.style.borderRadius = '';
    }, 3000);
  } else {
    console.error('Prompt element not found for ID:', promptId);
  }
}

// ===================================================================================
// ===== DATA TRACKING & STORAGE (Unchanged) =========================================
// ===================================================================================

function loadPromptsFromStorage(convoId) {
  chrome.storage.local.get([convoId], (data) => {
    currentPrompts = data[convoId] || [];
    const sidebar = document.getElementById("prompt-tracker-sidebar");
    if (sidebar && sidebar.updatePromptsDisplay) {
      sidebar.updatePromptsDisplay(currentPrompts);
    }
  });
}

function checkForNewPrompts() {
  const convoId = getConversationId();
  if (!convoId) {
      if (currentConversationId !== null) {
          const oldConvoId = currentConversationId;
          currentConversationId = null;
          currentPrompts = [];
          chrome.storage.local.remove([oldConvoId], () => {
              console.log(`Prompt Tracker: Cleaned up storage for deleted conversation: ${oldConvoId}`);
          });
          const sidebar = document.getElementById("prompt-tracker-sidebar");
          if (sidebar?.updatePromptsDisplay) sidebar.updatePromptsDisplay([]);
      }
      return;
  }

  if (convoId !== currentConversationId) {
    currentConversationId = convoId;
    loadPromptsFromStorage(convoId);
    return;
  }

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

  if (JSON.stringify(foundPrompts) !== JSON.stringify(currentPrompts)) {
    currentPrompts = foundPrompts;
    chrome.storage.local.set({ [convoId]: currentPrompts });
    
    const sidebar = document.getElementById("prompt-tracker-sidebar");
    if (sidebar && sidebar.updatePromptsDisplay) {
      sidebar.updatePromptsDisplay(currentPrompts);
    }
  }
}

// ===================================================================================
// ===== OBSERVERS & INITIALIZATION ==================================================
// ===================================================================================

function checkAndApplyResponsiveLogic() {
    const sidebar = document.getElementById('prompt-tracker-sidebar');
    const toggle = document.getElementById('prompt-sidebar-toggle');
    const mainContent = document.querySelector('div[class*="rounded-[28px]"]');

    if (!sidebar || !toggle || !mainContent) return;

    const mainContentWidth = mainContent.offsetWidth;
    if (mainContentWidth < 650) {
        toggle.style.display = 'flex';
        const isOpen = sidebar.style.right === "15px";
        if (isOpen) {
            sidebar.style.right = sidebarHiddenRightPos; 
            sidebar.style.pointerEvents = "none";
            const themeToggle = document.getElementById("theme-toggle-button");
            
            // MODIFIED: Animate the button off-screen instead of hiding it
            if (themeToggle) {
                themeToggle.style.right = '-100px';
            }

            toggle.classList.remove('prompt-toggle-close');
            toggle.innerHTML = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"></path><path d="M8 12.5L10.5 15L16 9"></path><path d="M12 2V3.5"></path><path d="M12 20.5V22"></path><path d="M22 12H20.5"></path><path d="M3.5 12H2"></path><path d="M4.92893 4.92893L5.99999 6"></path><path d="M18 18L19.0711 19.0711"></path><path d="M19.0711 4.92893L18 6"></path><path d="M6 18L4.92893 19.0711"></path></svg>`;
            toggle.style.top = "54px";
            toggle.style.right = "20px";
            toggle.style.width = "38px";
            toggle.style.height = "38px";
            toggle.style.padding = "10px";
            toggle.style.borderRadius = "10px";
            toggle.style.transform = '';
            applyTheme(currentTheme);
        }
        return; 
    }
    
    sidebar.style.display = 'block';
    toggle.style.display = 'flex';
    sidebar.style.width = sidebarDefaultWidth + 'px';
    sidebarHiddenRightPos = `-${sidebarDefaultWidth + 20}px`;
    if (sidebar.style.right !== "15px") {
        sidebar.style.right = sidebarHiddenRightPos;
    }
}

function startObservers() {
    const mainObserver = new MutationObserver(() => {
        clearTimeout(window.promptTrackerDebounce);
        window.promptTrackerDebounce = setTimeout(checkForNewPrompts, 100);
    });
    mainObserver.observe(document.body, { childList: true, subtree: true });
}

/**
 * The main entry point for the script.
 */
function main() {
    // ===== MODIFIED main() FUNCTION =====
    // 1. Load the theme from storage first.
    chrome.storage.local.get([themeStorageKey], (data) => {
        const savedTheme = data[themeStorageKey] || 'dark'; // Default to dark mode if nothing is saved

        // 2. Inject all UI elements.
        injectSidebar();
        startObservers();

        // 3. Apply the loaded (or default) theme to all elements.
        applyTheme(savedTheme);

        // 4. Set up resize observers and other initial checks.
        const debouncedResizeCheck = () => {
            setTimeout(checkAndApplyResponsiveLogic, 100);
        };
        
        window.addEventListener('resize', debouncedResizeCheck);
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
            debouncedResizeCheck();
            }
        });
        
        setTimeout(() => {
            checkForNewPrompts();
            checkAndApplyResponsiveLogic();
        }, 1500);
    });
}

// Run the script once the page is ready.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}