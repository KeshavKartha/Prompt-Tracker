// ===== Helper: Check if dark mode is active =====
function isDarkModeActive() {
  return document.documentElement.classList.contains('dark') || 
         document.body.classList.contains('dark-mode') ||
         window.matchMedia('(prefers-color-scheme: dark)').matches ||
         document.querySelector('html[data-theme="dark"]') ||
         getComputedStyle(document.body).backgroundColor === 'rgb(33, 33, 33)' ||
         getComputedStyle(document.body).backgroundColor === 'rgb(52, 53, 65)';
}

// ===== Helper: Get Current Conversation ID =====
function getConversationId() {
  const parts = window.location.pathname.split('/');
  const id = parts.includes("c") ? parts.pop() : null;
  return id && id.length > 5 ? id : null;
}

// ===== Helper: Post to Sidebar =====
function postPromptsToSidebar(prompts) {
  const sidebar = document.getElementById("prompt-tracker-sidebar");
  if (sidebar && sidebar.updatePromptsDisplay) {
    sidebar.updatePromptsDisplay(prompts);
  }
}

// ===== Helper: Generate Unique Prompt ID =====
function generatePromptId() {
  return 'prompt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

// ===== Inject Sidebar =====
function injectSidebar() {
  if (document.getElementById("prompt-tracker-sidebar")) return;

  // Create the sidebar container div instead of iframe
  const sidebar = document.createElement("div");
  sidebar.id = "prompt-tracker-sidebar";
  
  // Inject the sidebar HTML content directly
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3>Previous Prompts</h3>
      <div class="prompt-count">
        <span id="promptCount">0</span> prompts
      </div>
    </div>
    <div id="promptList" class="prompt-list-container"></div>
    
    <!-- Toast notification for copy feedback -->
    <div id="copyToast" class="copy-toast">
      <span>✓ Copied to clipboard!</span>
    </div>
  `;
  
  // Check if dark mode is active for sidebar styling
  const isDarkModeForSidebar = isDarkModeActive();
  
  sidebar.style.cssText = `
    position: fixed;
    top: 0;
    right: -380px; /* Start hidden, wider for better UX */
    width: 360px;
    height: 100%;
    background: transparent;
    border: none;
    z-index: 9999;
    pointer-events: none;
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    overflow-y: auto;
    color: ${isDarkModeForSidebar ? '#e0e0e0' : '#1f2937'};
  `;

  // Inject the CSS styles directly into the page
  if (!document.getElementById('prompt-tracker-styles')) {
    const style = document.createElement('style');
    style.id = 'prompt-tracker-styles';
    style.textContent = `
      /* Sidebar Header */
      #prompt-tracker-sidebar .sidebar-header {
        padding: 16px;
        border-bottom: none;
        background: rgba(30, 30, 30, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        margin: 12px;
        margin-bottom: 8px;
        position: sticky;
        top: 12px;
        z-index: 10;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }

      #prompt-tracker-sidebar .sidebar-header h3 {
        margin: 0 0 6px 0;
        font-size: 15px;
        font-weight: 600;
        color: ${isDarkModeForSidebar ? '#f0f0f0' : '#111827'};
      }

      #prompt-tracker-sidebar .prompt-count {
        font-size: 12px;
        color: ${isDarkModeForSidebar ? '#a0a0a0' : '#6b7280'};
        font-weight: 500;
      }

      /* Prompt list container */
      #prompt-tracker-sidebar .prompt-list-container {
        padding: 0 12px 12px 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
      }

      /* Custom scrollbar */
      #prompt-tracker-sidebar .prompt-list-container::-webkit-scrollbar {
        width: 6px;
      }

      #prompt-tracker-sidebar .prompt-list-container::-webkit-scrollbar-track {
        background: transparent;
      }

      #prompt-tracker-sidebar .prompt-list-container::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }

      #prompt-tracker-sidebar .prompt-list-container::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /* Empty state */
      #prompt-tracker-sidebar .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: ${isDarkModeForSidebar ? '#9ca3af' : '#6b7280'};
      }

      #prompt-tracker-sidebar .empty-icon {
        font-size: 32px;
        margin-bottom: 12px;
        opacity: 0.6;
      }

      #prompt-tracker-sidebar .empty-text {
        font-size: 16px;
        font-weight: 500;
        color: ${isDarkModeForSidebar ? '#d1d5db' : '#374151'};
        margin-bottom: 4px;
      }

      #prompt-tracker-sidebar .empty-subtext {
        font-size: 13px;
        color: ${isDarkModeForSidebar ? '#6b7280' : '#9ca3af'};
      }

      /* Prompt cards */
      #prompt-tracker-sidebar .prompt-card {
        background: rgba(40, 40, 40, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: all 0.15s ease;
        overflow: hidden;
        position: relative;
        min-height: 100px;
        max-height: none;
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        margin-bottom: 4px;
      }

      #prompt-tracker-sidebar .prompt-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        border-color: rgba(255, 255, 255, 0.12);
        background: rgba(45, 45, 45, 0.9);
      }

      /* Prompt content */
      #prompt-tracker-sidebar .prompt-content {
        font-size: 13px;
        line-height: 1.5;
        color: ${isDarkModeForSidebar ? '#e0e0e0' : '#374151'};
        white-space: pre-wrap;
        word-break: break-word;
        position: relative;
        min-height: 40px;
        max-height: 100px;
        overflow: hidden;
        margin-bottom: 12px;
        display: block !important;
        visibility: visible !important;
        flex-grow: 1;
      }

      #prompt-tracker-sidebar .prompt-content::before {
        content: attr(data-number) ". ";
        font-weight: 600;
        color: ${isDarkModeForSidebar ? '#a0a0a0' : '#888888'};
        margin-right: 8px;
      }

      #prompt-tracker-sidebar .prompt-content.long::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 30px;
        background: linear-gradient(to bottom, transparent, rgba(40, 40, 40, 1));
        pointer-events: none;
      }

      /* Prompt actions */
      #prompt-tracker-sidebar .prompt-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 6px;
        margin-top: auto;
        margin-bottom: 4px;
        flex-shrink: 0;
        min-height: 32px;
        padding-top: 4px;
      }

      #prompt-tracker-sidebar .copy-btn {
        background: none;
        border: none;
        padding: 6px;
        border-radius: 4px;
        cursor: pointer;
        color: ${isDarkModeForSidebar ? '#a0a0a0' : '#6b7280'};
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        min-width: 28px;
        min-height: 28px;
        flex-shrink: 0;
      }

      #prompt-tracker-sidebar .copy-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: ${isDarkModeForSidebar ? '#e0e0e0' : '#374151'};
        opacity: 1;
      }

      #prompt-tracker-sidebar .jump-btn {
        background: rgba(160, 160, 160, 0.1);
        border: 1px solid rgba(160, 160, 160, 0.2);
        color: ${isDarkModeForSidebar ? '#cccccc' : '#555555'};
        padding: 5px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        gap: 2px;
        min-height: 28px;
        white-space: nowrap;
        flex-shrink: 0;
      }

      #prompt-tracker-sidebar .jump-btn:hover {
        background: rgba(160, 160, 160, 0.15);
        border-color: rgba(160, 160, 160, 0.3);
        transform: translateY(-0.5px);
      }

      /* Copy toast notification */
      #prompt-tracker-sidebar .copy-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 1000;
      }

      #prompt-tracker-sidebar .copy-toast.show {
        transform: translateY(0);
        opacity: 1;
      }

      #prompt-tracker-sidebar .copy-toast span {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(sidebar);

  // Load and initialize the sidebar functionality
  loadSidebarScript(sidebar);
  
  // Create toggle button
  createToggleButton();
}

// ===== Load Sidebar Script Functionality =====
function loadSidebarScript(sidebar) {
  // Initialize sidebar functionality directly
  const promptList = sidebar.querySelector('#promptList');
  const promptCount = sidebar.querySelector('#promptCount');
  const copyToast = sidebar.querySelector('#copyToast');

  // Function to update prompts display
  function updatePromptsDisplay(prompts) {
    if (!promptList || !promptCount) return;

    promptCount.textContent = prompts.length;

    if (prompts.length === 0) {
      promptList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💭</div>
          <div class="empty-text">No prompts yet</div>
          <div class="empty-subtext">Start a conversation to see your prompts here</div>
        </div>
      `;
      return;
    }

    promptList.innerHTML = prompts.map((prompt, index) => `
      <div class="prompt-card ${prompt.content.length > 200 ? 'long' : ''}" data-id="${prompt.id}">
        <div class="prompt-content" data-number="${index + 1}">${prompt.content}</div>
        <div class="prompt-actions">
          <button class="copy-btn" title="Copy prompt" data-prompt="${encodeURIComponent(prompt.content)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="jump-btn" title="Jump to prompt" data-prompt-id="${prompt.id}">
            ↗ Jump
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners for buttons
    sidebar.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const content = decodeURIComponent(btn.dataset.prompt);
        navigator.clipboard.writeText(content).then(() => {
          showCopyToast();
        });
      });
    });

    sidebar.querySelectorAll('.jump-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const promptId = btn.dataset.promptId;
        jumpToPrompt(promptId);
      });
    });
  }

  // Function to show copy toast
  function showCopyToast() {
    if (!copyToast) return;
    copyToast.classList.add('show');
    setTimeout(() => {
      copyToast.classList.remove('show');
    }, 2000);
  }

  // Function to jump to prompt
  function jumpToPrompt(promptId) {
    const promptElement = document.querySelector(`[data-prompt-id="${promptId}"]`);
    if (promptElement) {
      promptElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      promptElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      setTimeout(() => {
        promptElement.style.backgroundColor = '';
      }, 2000);
    }
  }

  // Store reference for updating
  sidebar.updatePromptsDisplay = updatePromptsDisplay;

  // Initial load
  const conversationId = getConversationId();
  if (conversationId) {
    chrome.storage.local.get([conversationId], (result) => {
      const prompts = result[conversationId] || [];
      updatePromptsDisplay(prompts);
    });
  } else {
    updatePromptsDisplay([]);
  }
}

// ===== Continue with toggle button creation after loadSidebarScript =====
function createToggleButton() {
  // Remove existing button if present
  const existingToggle = document.getElementById("prompt-sidebar-toggle");
  if (existingToggle) {
    existingToggle.remove();
  }

  console.log("Creating toggle button...");

  // Create toggle button
  const toggle = document.createElement("button");
  toggle.id = "prompt-sidebar-toggle";
  toggle.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 3h18v18H3z"/>
      <path d="M8 7h8"/>
      <path d="M8 11h8"/>
      <path d="M8 15h5"/>
    </svg>
  `;
  // Check if dark mode is active
  const isDarkModeForToggle = isDarkModeActive();

  toggle.style.cssText = `
    position: fixed !important;
    top: 64px !important;
    right: 16px !important;
    z-index: 99999 !important;
    padding: 10px !important;
    background: ${isDarkModeForToggle ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
    border: 1px solid ${isDarkModeForToggle ? 'rgba(80, 80, 80, 0.3)' : 'rgba(0, 0, 0, 0.08)'} !important;
    border-radius: 50% !important;
    box-shadow: 0 2px 8px ${isDarkModeForToggle ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'} !important;
    cursor: pointer !important;
    backdrop-filter: blur(12px) !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: ${isDarkModeForToggle ? '#e0e0e0' : '#374151'} !important;
    transition: all 0.2s ease !important;
    user-select: none !important;
    width: 40px !important;
    height: 40px !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
  `;
  
  // Add hover effects
  toggle.addEventListener("mouseenter", () => {
    const isDarkMode = isDarkModeActive();
    
    toggle.style.transform = "translateY(-1px)";
    toggle.style.boxShadow = isDarkMode ? "0 4px 12px rgba(0, 0, 0, 0.4)" : "0 4px 12px rgba(0, 0, 0, 0.15)";
    toggle.style.background = isDarkMode ? "rgba(40, 40, 40, 1)" : "rgba(255, 255, 255, 1)";
  });
  
  toggle.addEventListener("mouseleave", () => {
    const isDarkMode = isDarkModeActive();
    
    toggle.style.transform = "translateY(0)";
    toggle.style.boxShadow = isDarkMode ? "0 4px 12px rgba(0, 0, 0, 0.5)" : "0 4px 12px rgba(0, 0, 0, 0.15)";
    toggle.style.background = isDarkMode ? "rgba(40, 40, 40, 0.95)" : "rgba(255, 255, 255, 0.95)";
  });

  toggle.addEventListener("click", () => {
    const isDarkMode = isDarkModeActive();
    const sidebar = document.getElementById("prompt-tracker-sidebar");
    
    const isOpen = sidebar.style.right === "0px";
    sidebar.style.right = isOpen ? "-380px" : "0px";
    sidebar.style.pointerEvents = isOpen ? "none" : "auto";
    
    // Update button appearance and content based on state
    if (isOpen) {
      // Sidebar is closing - show normal button
      toggle.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 3h18v18H3z"/>
          <path d="M8 7h8"/>
          <path d="M8 11h8"/>
          <path d="M8 15h5"/>
        </svg>
      `;
      toggle.style.background = isDarkMode ? "rgba(40, 40, 40, 0.95)" : "rgba(255, 255, 255, 0.95)";
      toggle.style.color = isDarkMode ? "#e0e0e0" : "#374151";
      toggle.style.top = "64px";
      toggle.style.right = "16px";
      toggle.style.left = "auto";
      toggle.style.width = "40px";
      toggle.style.height = "40px";
      toggle.style.borderRadius = "50%";
      toggle.style.padding = "10px";
      toggle.style.display = "flex";
      toggle.style.opacity = "1";
      toggle.style.visibility = "visible";
      toggle.style.pointerEvents = "auto";
    } else {
      // Sidebar is opening - show close button on right side
      toggle.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      toggle.style.background = "rgba(60, 60, 60, 0.95)";
      toggle.style.color = "white";
      toggle.style.top = "20px";
      toggle.style.right = "24px";
      toggle.style.left = "auto";
      toggle.style.width = "32px";
      toggle.style.height = "32px";
      toggle.style.borderRadius = "50%";
      toggle.style.padding = "6px";
      toggle.style.display = "flex";
      toggle.style.alignItems = "center";
      toggle.style.justifyContent = "center";
    }
  });

  document.body.appendChild(toggle);
  
  console.log("Toggle button created and appended to body");
  
  // Also try to append to other containers for redundancy
  const navContainer = document.querySelector('nav');
  const headerContainer = document.querySelector('header');
  const mainContainer = document.querySelector('main');
  
  if (navContainer && !navContainer.querySelector('#prompt-sidebar-toggle-nav')) {
    const navToggle = toggle.cloneNode(true);
    navToggle.id = 'prompt-sidebar-toggle-nav';
    navToggle.style.display = 'none'; // Hidden backup
    navContainer.appendChild(navToggle);
    console.log("Backup button created in nav");
  }
  
  // Check if button is still present every 5 seconds and recreate if missing
  setTimeout(() => {
    const checkButton = () => {
      const buttonExists = document.getElementById("prompt-sidebar-toggle");
      if (!buttonExists) {
        console.log("Toggle button disappeared, recreating...");
        
        // Try to show the backup button first
        const backupButton = document.querySelector('#prompt-sidebar-toggle-nav');
        if (backupButton) {
          backupButton.style.display = 'flex';
          backupButton.id = 'prompt-sidebar-toggle';
          console.log("Activated backup button");
        } else {
          createToggleButton();
        }
      } else {
        // Schedule next check
        setTimeout(checkButton, 5000);
      }
    };
    checkButton();
  }, 5000);
}

injectSidebar();

// ===== Button Persistence Observer =====
// Watch for DOM changes that might remove our button
const buttonObserver = new MutationObserver(() => {
  const button = document.getElementById("prompt-sidebar-toggle");
  if (!button) {
    console.log("Button removed by DOM changes, recreating...");
    createToggleButton();
  }
});

// Start observing the document body for child list changes
buttonObserver.observe(document.body, {
  childList: true,
  subtree: true
});

console.log("Button observer started");

// ===== Prompt Tracking =====
let currentPrompts = [];
let currentConversationId = null;
const promptIdMap = new WeakMap();

// ===== Load from Storage =====
function loadPromptsFromStorage(convoId) {
  chrome.storage.local.get([convoId], (data) => {
    const stored = data[convoId] || [];
    currentPrompts = stored;
    postPromptsToSidebar(stored);
  });
}

const MAX_PREVIEW_CHARS = 300;

function getSmartTrimmedText(text) {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_PREVIEW_CHARS) return trimmed;

  // Try to cut at the end of a sentence or word boundary
  const end = trimmed.slice(0, MAX_PREVIEW_CHARS).lastIndexOf(".");
  const safeCut = end > 100 ? end + 1 : MAX_PREVIEW_CHARS;

  return trimmed.slice(0, safeCut).trim() + " …";
}

// ===== Mutation Observer: Track New Prompts =====
const chatObserver = new MutationObserver(() => {
  const convoId = getConversationId();
  if (!convoId) return;

  if (convoId !== currentConversationId) {
    currentConversationId = convoId;
    currentPrompts = []; // Clear prompts when switching conversations
    postPromptsToSidebar([]); // Clear sidebar display
    loadPromptsFromStorage(convoId);
  }

  // Try multiple selectors to find user messages with more comprehensive approach
  let messages = [];
  
  // Method 1: Try the standard data attribute
  messages = Array.from(document.querySelectorAll('div[data-message-author-role="user"]'));
  
  // Method 2: If that doesn't work, try looking for user message containers
  if (messages.length === 0) {
    messages = Array.from(document.querySelectorAll('div[data-testid*="user"], div[class*="user"]'));
  }
  
  // Method 3: Look for conversation turns and identify user messages
  if (messages.length === 0) {
    const conversationTurns = Array.from(document.querySelectorAll('div[class*="conversation-turn"], div[class*="group"]'));
    messages = conversationTurns.filter(turn => {
      // Look for indicators that this is a user message
      const hasUserAvatar = turn.querySelector('img[alt*="User"], div[class*="user-avatar"]');
      const hasUserIcon = turn.querySelector('svg') && !turn.querySelector('svg[class*="openai"]');
      return hasUserAvatar || hasUserIcon || 
             turn.querySelector('div')?.innerText?.length > 0 && 
             !turn.querySelector('div[class*="markdown"], pre, code');
    });
  }
  
  // Method 4: Fallback - look for message pairs and take every other one
  if (messages.length === 0) {
    const allMessages = Array.from(document.querySelectorAll('div[class*="group"], div[class*="flex"]'))
      .filter(el => el.innerText?.trim().length > 10);
    messages = allMessages.filter((_, index) => index % 2 === 0); // Take every other message (assuming user messages are first)
  }

  console.log('Found messages using method:', messages.length > 0 ? 'success' : 'none', 'Count:', messages.length);

  const newPromptData = [];

  for (const msg of messages) {
    if (!msg.dataset.promptId) {
      const promptText = msg.innerText.trim();
      if (!promptText) continue;

      console.log('Processing prompt:', promptText.substring(0, 50) + '...'); // Debug log

      const promptId = generatePromptId();
      msg.dataset.promptId = promptId;

      promptIdMap.set(msg, promptId);

      newPromptData.push({
        id: promptId,
        content: promptText, // Changed from 'text' to 'content' to match sidebar expectations
        preview: getSmartTrimmedText(promptText),
      });
    } else {
      // Already processed
      const existing = currentPrompts.find(p => p.id === msg.dataset.promptId);
      if (existing) newPromptData.push(existing);
    }
  }

  console.log('New prompt data:', newPromptData); // Debug log

  if (JSON.stringify(newPromptData) !== JSON.stringify(currentPrompts)) {
    currentPrompts = newPromptData;
    chrome.storage.local.set({ [convoId]: newPromptData });
    postPromptsToSidebar(newPromptData);
  }
});

const chatContainer = document.querySelector("main");
if (chatContainer) {
  chatObserver.observe(chatContainer, { childList: true, subtree: true });
}

// Add a manual trigger for debugging - run the observer once on load
setTimeout(() => {
  console.log('Manual trigger - checking for prompts...');
  
  // Debug: Log page structure
  console.log('=== ChatGPT Structure Debug ===');
  console.log('Main container:', document.querySelector('main'));
  console.log('All divs:', document.querySelectorAll('div').length);
  console.log('Message-like elements:', document.querySelectorAll('div[class*="group"], div[class*="conversation"], div[class*="message"]').length);
  
  // Manually trigger the observer function
  const convoId = getConversationId();
  if (!convoId) return;

  if (convoId !== currentConversationId) {
    currentConversationId = convoId;
    currentPrompts = []; // Clear prompts when switching conversations
    postPromptsToSidebar([]); // Clear sidebar display
    loadPromptsFromStorage(convoId);
  }

  // Try multiple selectors to find user messages with more comprehensive approach
  let messages = [];
  
  // Method 1: Try the standard data attribute
  messages = Array.from(document.querySelectorAll('div[data-message-author-role="user"]'));
  
  // Method 2: If that doesn't work, try looking for user message containers
  if (messages.length === 0) {
    messages = Array.from(document.querySelectorAll('div[data-testid*="user"], div[class*="user"]'));
  }
  
  // Method 3: Look for conversation turns and identify user messages
  if (messages.length === 0) {
    const conversationTurns = Array.from(document.querySelectorAll('div[class*="conversation-turn"], div[class*="group"]'));
    messages = conversationTurns.filter(turn => {
      // Look for indicators that this is a user message
      const hasUserAvatar = turn.querySelector('img[alt*="User"], div[class*="user-avatar"]');
      const hasUserIcon = turn.querySelector('svg') && !turn.querySelector('svg[class*="openai"]');
      return hasUserAvatar || hasUserIcon || 
             turn.querySelector('div')?.innerText?.length > 0 && 
             !turn.querySelector('div[class*="markdown"], pre, code');
    });
  }
  
  // Method 4: Fallback - look for message pairs and take every other one
  if (messages.length === 0) {
    const allMessages = Array.from(document.querySelectorAll('div[class*="group"], div[class*="flex"]'))
      .filter(el => el.innerText?.trim().length > 10);
    messages = allMessages.filter((_, index) => index % 2 === 0); // Take every other message (assuming user messages are first)
  }

  console.log('Found messages using method:', messages.length > 0 ? 'success' : 'none', 'Count:', messages.length);

  const newPromptData = [];

  for (const msg of messages) {
    if (!msg.dataset.promptId) {
      const promptText = msg.innerText.trim();
      if (!promptText) continue;

      console.log('Processing prompt:', promptText.substring(0, 50) + '...'); // Debug log

      const promptId = generatePromptId();
      msg.dataset.promptId = promptId;

      promptIdMap.set(msg, promptId);

      newPromptData.push({
        id: promptId,
        content: promptText, // Changed from 'text' to 'content' to match sidebar expectations
        preview: getSmartTrimmedText(promptText),
      });
    } else {
      // Already processed
      const existing = currentPrompts.find(p => p.id === msg.dataset.promptId);
      if (existing) newPromptData.push(existing);
    }
  }

  console.log('New prompt data:', newPromptData); // Debug log

  if (JSON.stringify(newPromptData) !== JSON.stringify(currentPrompts)) {
    currentPrompts = newPromptData;
    chrome.storage.local.set({ [convoId]: newPromptData });
    postPromptsToSidebar(newPromptData);
  }
}, 2000);

// Also add a window function for manual debugging
window.debugPromptTracker = () => {
  console.log('=== Prompt Tracker Debug ===');
  console.log('Current conversation ID:', getConversationId());
  console.log('Current prompts:', currentPrompts);
  
  // Try to find messages manually
  const userMessages = document.querySelectorAll('div[data-message-author-role="user"]');
  console.log('User messages found:', userMessages.length);
  userMessages.forEach((msg, i) => {
    console.log(`Message ${i}:`, msg.innerText?.substring(0, 100));
  });
  
  // Manually run the same logic as the observer
  const convoId = getConversationId();
  if (convoId) {
    console.log('Manually triggering prompt detection...');
    // This will trigger the same logic without relying on the observer callback
    setTimeout(() => {
      const event = new Event('chatUpdate');
      document.dispatchEvent(event);
    }, 100);
  }
};

// ===== Handle Deletion =====
let pendingDeleteId = null;

document.addEventListener('click', (e) => {
  if (!(e.target instanceof SVGElement)) return;

  const chatItem = e.target.closest('nav a[href*="/c/"]');
  if (!chatItem) return;

  const chatId = chatItem.getAttribute('href')?.split('/').pop();
  if (chatId) {
    pendingDeleteId = chatId;
    console.log("Captured pending delete ID:", pendingDeleteId);
  }
});

// ===== Final Confirm Deletion from Modal =====
const bodyObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;

      const modal = node.querySelector?.('div[role="dialog"]');
      if (modal && /delete/i.test(modal.innerText)) {
        const deleteBtn = Array.from(modal.querySelectorAll("button")).find(
          (btn) => btn.innerText.trim().toLowerCase() === "delete"
        );

        if (deleteBtn) {
          deleteBtn.addEventListener(
            'click',
            () => {
              if (pendingDeleteId) {
                chrome.storage.local.remove(pendingDeleteId, () => {
                  console.log("🗑️ Removed from storage:", pendingDeleteId);
                  pendingDeleteId = null;
                });
              }
            },
            { once: true }
          );
        }
      }
    }
  }
});

bodyObserver.observe(document.body, { childList: true, subtree: true });

// ===== New Chat Detection =====
document.addEventListener('click', (e) => {
  // Check for new chat button clicks
  const target = e.target;
  const isNewChatButton = target.closest('a[href="/"]') || 
                         target.closest('button[aria-label*="New chat"]') ||
                         target.closest('[data-testid="new-chat"]') ||
                         (target.textContent && target.textContent.trim().toLowerCase().includes('new chat'));
  
  if (isNewChatButton) {
    // Clear current prompts immediately
    currentPrompts = [];
    currentConversationId = null;
    postPromptsToSidebar([]);
    console.log("🔄 New chat started - prompt history cleared");
  }
});

// ===== URL Change Detection for New Chats =====
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    
    // If navigating to home page (new chat), clear prompts
    if (currentUrl === 'https://chatgpt.com/' || currentUrl === 'https://chat.openai.com/') {
      currentPrompts = [];
      currentConversationId = null;
      postPromptsToSidebar([]);
      console.log("🔄 Navigated to new chat - prompt history cleared");
    }
  }
});

urlObserver.observe(document, { subtree: true, childList: true });


window.addEventListener("message", (event) => {
  if (event.data?.type === "JUMP_TO_PROMPT") {
    const promptId = event.data.promptId;
    const target = document.querySelector(`[data-prompt-id="${promptId}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.style.backgroundColor = "#ffe58f";
      setTimeout(() => (target.style.backgroundColor = ""), 1500);
    } else {
      console.warn("⚠️ Prompt not found for ID:", promptId);
    }
  }
});
