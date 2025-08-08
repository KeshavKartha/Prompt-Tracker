/**
 * Prompt Tracker for ChatGPT
 *
 * This script injects a sidebar into the ChatGPT interface to track and manage prompts within a conversation.
 * It uses a direct DIV injection method and robust, width-based responsive logic.
 */

// ===================================================================================
// ===== STATE & HELPERS =============================================================
// ===================================================================================

let currentPrompts = [];
let currentConversationId = null;
const promptIdMap = new WeakMap();
let sidebarHiddenRightPos = "-280px";
const sidebarDefaultWidth = 260;

/**
 * Checks for dark mode using multiple reliable methods.
 * @returns {boolean} True if dark mode is active.
 */
function isDarkModeActive() {
  return document.documentElement.classList.contains('dark') ||
    document.body.classList.contains('dark-mode') ||
    window.matchMedia('(prefers-color-scheme: dark)').matches ||
    document.querySelector('html[data-theme="dark"]') ||
    getComputedStyle(document.body).backgroundColor === 'rgb(33, 33, 33)' ||
    getComputedStyle(document.body).backgroundColor === 'rgb(52, 53, 65)';
}

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
// ===== UI INJECTION & MANAGEMENT ===================================================
// ===================================================================================

/**
 * Injects the sidebar container and its associated styles into the page.
 */
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

  const isDark = isDarkModeActive();
  
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
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12.5px;
    color: ${isDark ? '#e0e0e0' : '#1f2937'};
  `;
  
  if (!document.getElementById('prompt-tracker-styles')) {
    const style = document.createElement('style');
    style.id = 'prompt-tracker-styles';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;600&display=swap');

      #prompt-sidebar-toggle:not(.prompt-toggle-close):hover {
        background: ${isDark ? 'rgba(55, 55, 55, 0.95)' : 'rgba(240, 240, 240, 0.95)'} !important;
      }
      #prompt-sidebar-toggle.prompt-toggle-close:hover {
        transform: scale(1.05) rotate(90deg);
        background-color: rgba(239, 68, 68, 0.9) !important;
        border-color: rgba(239, 68, 68, 0.9) !important;
      }
       #prompt-tracker-sidebar .prompt-list-container::-webkit-scrollbar-thumb:hover {
        background: rgba(${isDark ? '255,255,255,0.35' : '0,0,0,0.35'});
      }
      
      #prompt-tracker-sidebar .sidebar-header {
        padding: 14px;
        border-bottom: none; 
        background: ${isDark ? '#121212' : 'rgba(248,248,248,0.9)'};
        border: 1px solid rgba(${isDark ? '255,255,255,0.1' : '0,0,0,0.05'});
        border-radius: 8px; margin: 12px; margin-bottom: 8px;
        position: sticky; top: 12px; z-index: 10; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 2px 6px rgba(0,0,0,${isDark ? '0.1' : '0.05'});
      }
      
      #prompt-tracker-sidebar .sidebar-header h3 { 
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: ${isDark ? '#f0f0f0' : '#111827'};
      }

      #prompt-tracker-sidebar .prompt-count { font-size: 11.5px; color: ${isDark ? '#a0a0a0' : '#6b7280'}; font-weight: 500; }
      #prompt-tracker-sidebar .prompt-list-container { padding: 0 12px 12px 12px; display: flex; flex-direction: column; gap: 12px; height: calc(100vh - 90px); overflow-y: auto; }
      #prompt-tracker-sidebar .prompt-list-container::-webkit-scrollbar { width: 6px; }
      #prompt-tracker-sidebar .prompt-list-container::-webkit-scrollbar-track { background: transparent; }
      #prompt-tracker-sidebar .prompt-list-container::-webkit-scrollbar-thumb { background: rgba(${isDark ? '255,255,255,0.2' : '0,0,0,0.2'}); border-radius: 3px; transition: background 0.2s ease; }
      
      #prompt-tracker-sidebar .empty-state { text-align: center; padding: 40px 20px; color: ${isDark ? '#9ca3af' : '#6b7280'}; background: rgba(${isDark ? '30,30,30,0.9' : '248,248,248,0.9'}); border: 1px solid rgba(${isDark ? '255,255,255,0.08' : '0,0,0,0.05'}); border-radius: 8px; margin: 0 12px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      #prompt-tracker-sidebar .empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.6; }
      #prompt-tracker-sidebar .empty-text { font-size: 15px; font-weight: 500; color: ${isDark ? '#d1d5db' : '#374151'}; margin-bottom: 4px; }
      #prompt-tracker-sidebar .empty-subtext { font-size: 12.5px; color: ${isDark ? '#6b7280' : '#9ca3af'}; margin-bottom: 16px; }
      #prompt-tracker-sidebar .empty-refresh-hint { font-size: 11.5px; color: ${isDark ? '#60a5fa' : '#3b82f6'}; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 6px; padding: 8px 12px; margin-top: 12px; font-style: italic; }

      /* --- MODIFIED RULE --- */
      #prompt-tracker-sidebar .prompt-card { background: rgba(${isDark ? '40,40,40,0.85' : '255,255,255,0.85'}); border: 1px solid rgba(${isDark ? '255,255,255,0.08' : '0,0,0,0.05'}); border-radius: 8px; padding: 12px; box-shadow: 0 4px 12px rgba(0,0,0,${isDark ? '0.2' : '0.08'}); cursor: pointer; transition: all 0.15s ease; overflow: hidden; position: relative; min-height: 25px; /* Changed from 80px */ display: flex; flex-direction: column; flex-shrink: 0; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      
      #prompt-tracker-sidebar .prompt-card:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,${isDark ? '0.25' : '0.1'}); border-color: rgba(${isDark ? '255,255,255,0.12' : '0,0,0,0.08'}); background: rgba(${isDark ? '45,45,45,0.9' : '255,255,255,0.9'}); }
      
      #prompt-tracker-sidebar .prompt-content {
        font-family: 'Figtree', sans-serif;
        font-size: 13.5px;
        line-height: 1.5;
        color: ${isDark ? '#e0e0e0' : '#374151'};
        white-space: pre-wrap;
        word-break: break-word;
        position: relative;
        min-height: 20px;
        max-height: 100px;
        overflow: hidden;
      }
      
      /* --- MODIFIED RULE --- */
      #prompt-tracker-sidebar .prompt-content.long {
        max-height: 115px; /* Changed from 250px */
      }

      #prompt-tracker-sidebar .prompt-content::before { content: attr(data-number) ". "; font-weight: 600; color: ${isDark ? '#a0a0a0' : '#888888'}; margin-right: 4px; }
      #prompt-tracker-sidebar .prompt-actions { display: flex; justify-content: flex-end; align-items: center; gap: 6px; margin-top: auto; flex-shrink: 0; min-height: 24px; padding: 4px 2px 0 0; }
      #prompt-tracker-sidebar .copy-btn { background: none; border: none; padding: 4px; border-radius: 4px; cursor: pointer; color: ${isDark ? '#a0a0a0' : '#6b7280'}; transition: all 0.15s ease; display: flex; align-items: center; justify-content: center; opacity: 0.7; }
      #prompt-tracker-sidebar .copy-btn:hover { background: rgba(${isDark ? '255,255,255,0.05' : '0,0,0,0.05'}); color: ${isDark ? '#e0e0e0' : '#374151'}; opacity: 1; }
      #prompt-tracker-sidebar .copy-toast { position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; font-size: 12.5px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: translateY(100px); opacity: 0; transition: all 0.3s ease; z-index: 10000; }
      #prompt-tracker-sidebar .copy-toast.show { transform: translateY(0); opacity: 1; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(sidebar);
  loadSidebarScript(sidebar);
  createToggleButton();
}

/**
 * Creates the floating toggle button.
 */
function createToggleButton() {
  if (document.getElementById("prompt-sidebar-toggle")) return;

  const toggle = document.createElement("button");
  toggle.id = "prompt-sidebar-toggle";
  const isDark = isDarkModeActive();
  
  toggle.innerHTML = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"></path><path d="M8 12.5L10.5 15L16 9"></path><path d="M12 2V3.5"></path><path d="M12 20.5V22"></path><path d="M22 12H20.5"></path><path d="M3.5 12H2"></path><path d="M4.92893 4.92893L5.99999 6"></path><path d="M18 18L19.0711 19.0711"></path><path d="M19.0711 4.92893L18 6"></path><path d="M6 18L4.92893 19.0711"></path></svg>`;
  
  toggle.style.cssText = `
    position: fixed; 
    top: 54px; right: 20px;
    z-index: 99999;
    padding: 10px; 
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    background: ${isDark ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)'};
    border: 1px solid ${isDark ? 'rgba(80,80,80,0.3)' : 'rgba(0,0,0,0.08)'};
    border-radius: 10px; 
    color: ${isDark ? '#e0e0e0' : '#374151'};
    box-shadow: 0 2px 8px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'};
    cursor: pointer; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    transition: all 0.2s ease-in-out;
  `;

  toggle.addEventListener("click", () => {
    const sidebar = document.getElementById("prompt-tracker-sidebar");
    if (!sidebar) {
      injectSidebar();
      return;
    }
    const isOpen = sidebar.style.right === "15px";
    
    sidebar.style.right = isOpen ? sidebarHiddenRightPos : "15px"; 
    sidebar.style.pointerEvents = isOpen ? "none" : "auto";

    if (isOpen) {
      toggle.classList.remove('prompt-toggle-close');
      toggle.innerHTML = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"></path><path d="M8 12.5L10.5 15L16 9"></path><path d="M12 2V3.5"></path><path d="M12 20.5V22"></path><path d="M22 12H20.5"></path><path d="M3.5 12H2"></path><path d="M4.92893 4.92893L5.99999 6"></path><path d="M18 18L19.0711 19.0711"></path><path d="M19.0711 4.92893L18 6"></path><path d="M6 18L4.92893 19.0711"></path></svg>`;
      toggle.style.top = "57px";
      toggle.style.right = "22px";
      toggle.style.width = "38px";
      toggle.style.height = "38px";
      toggle.style.padding = "10px";
      toggle.style.borderRadius = "10px";
      toggle.style.transform = '';
      toggle.style.background = isDarkModeActive() ? "rgba(40,40,40,0.95)" : "rgba(255,255,255,0.95)";
      toggle.style.color = isDarkModeActive() ? "#e0e0e0" : "#374151";
      toggle.style.border = `1px solid ${isDarkModeActive() ? 'rgba(80,80,80,0.3)' : 'rgba(0,0,0,0.08)'}`;
    } else {
      toggle.classList.add('prompt-toggle-close');
      toggle.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      toggle.style.top = "22px";
      toggle.style.right = "38px";
      toggle.style.width = "30px";
      toggle.style.height = "30px";
      toggle.style.padding = "6px";
      toggle.style.borderRadius = "8px";
      toggle.style.background = isDarkModeActive() ? "rgba(40,40,40,0.95)" : "rgba(255,255,255,0.95)";
      toggle.style.color = isDarkModeActive() ? "#e0e0e0" : "#374151";
      toggle.style.border = `1px solid ${isDarkModeActive() ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`;
    }
  });

  document.body.appendChild(toggle);
}
// ===================================================================================
// ===== SIDEBAR SCRIPT LOGIC ========================================================
// ===================================================================================

/**
 * Attaches event listeners and methods to the injected sidebar element.
 * @param {HTMLElement} sidebar The main sidebar div element.
 */
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

/**
 * The main "jump to" function. Finds the prompt in the DOM and scrolls to it.
 * @param {string} promptId The ID of the prompt to find.
 */
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
    document.querySelectorAll('.prompt-highlight').forEach(el => {
        el.classList.remove('prompt-highlight');
        el.style.backgroundColor = '';
        el.style.border = '';
        el.style.borderRadius = '';
    });

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
// ===== DATA TRACKING & STORAGE =====================================================
// ===================================================================================

/**
 * Loads prompts for the given conversation ID from chrome.storage.
 * @param {string} convoId The conversation ID.
 */
function loadPromptsFromStorage(convoId) {
  chrome.storage.local.get([convoId], (data) => {
    currentPrompts = data[convoId] || [];
    const sidebar = document.getElementById("prompt-tracker-sidebar");
    if (sidebar && sidebar.updatePromptsDisplay) {
      sidebar.updatePromptsDisplay(currentPrompts);
    }
  });
}

/**
 * Scans the DOM for user prompts, assigns IDs, and updates storage if changes are found.
 */
function checkForNewPrompts() {
  const convoId = getConversationId();
  if (!convoId) {
      if (currentConversationId !== null) {
          // Capture the ID of the conversation we are leaving.
          const oldConvoId = currentConversationId;
          
          // Reset the internal state.
          currentConversationId = null;
          currentPrompts = [];

          // *** FIX: Explicitly remove the old conversation's data from storage. ***
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

/**
 * Adjusts the sidebar and toggle based on the main content area's width.
 * This is the primary function for responsive behavior.
 */
function checkAndApplyResponsiveLogic() {
    const sidebar = document.getElementById('prompt-tracker-sidebar');
    const toggle = document.getElementById('prompt-sidebar-toggle');
    
    const mainContent = document.querySelector('div[class*="rounded-[28px]"]');

    if (!sidebar || !toggle || !mainContent) {
        return;
    }

    const mainContentWidth = mainContent.offsetWidth;
    let newSidebarWidth = sidebarDefaultWidth;

    if (mainContentWidth < 650) {
        sidebar.style.display = 'none';
        toggle.style.display = 'none';
        return;
    }
    
    sidebar.style.display = 'block';
    toggle.style.display = 'flex';
 
    sidebar.style.width = newSidebarWidth + 'px';

    sidebarHiddenRightPos = `-${newSidebarWidth + 20}px`;

    const isOpen = sidebar.style.right === "15px";
    if (!isOpen) {
        sidebar.style.right = sidebarHiddenRightPos;
    }
}


/**
 * Sets up and starts MutationObservers to watch for DOM changes.
 */
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
  injectSidebar();
  startObservers();
  
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
}

// Run the script once the page is ready.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}