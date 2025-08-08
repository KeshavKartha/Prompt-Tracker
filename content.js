// ===== Dark Mode State =====
let isDarkMode = false;

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
      <div class="header-top">
        <h3>Previous Prompts</h3>
        <div class="header-buttons">
          <button id="darkModeToggle" class="header-btn" title="Toggle Dark Mode">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </button>
          <button id="closeSidebar" class="header-btn" title="Close Sidebar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
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
  
  sidebar.style.cssText = `
    position: fixed;
    top: 0;
    right: -323px; /* Start hidden, narrower by 1.5cm */
    width: 303px;
    height: 100%;
    background: transparent;
    border: none;
    z-index: 9999;
    pointer-events: none;
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    overflow-y: hidden;
    color: #e0e0e0 !important;
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

      #prompt-tracker-sidebar .header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }

      #prompt-tracker-sidebar .sidebar-header h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #f0f0f0 !important;
      }

      #prompt-tracker-sidebar .header-buttons {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      #prompt-tracker-sidebar .header-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        padding: 6px;
        cursor: pointer;
        color: #e0e0e0 !important;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      #prompt-tracker-sidebar .header-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.25);
        transform: translateY(-1px);
        color: #ffffff !important;
      }

      #prompt-tracker-sidebar .header-btn svg {
        transition: all 0.2s ease;
      }

      #prompt-tracker-sidebar .prompt-count {
        font-size: 12px;
        color: #a0a0a0 !important;
        font-weight: 500;
      }

      /* Dark mode styles */
      #prompt-tracker-sidebar.dark-mode .sidebar-header {
        background: rgba(15, 15, 15, 0.95);
        border-color: rgba(255, 255, 255, 0.05);
      }

      #prompt-tracker-sidebar.dark-mode .sidebar-header h3 {
        color: #ffffff !important;
      }

      #prompt-tracker-sidebar.dark-mode .prompt-count {
        color: #b0b0b0 !important;
      }

      #prompt-tracker-sidebar.dark-mode .header-btn {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.08);
        color: #c0c0c0 !important;
      }

      #prompt-tracker-sidebar.dark-mode .header-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.2);
        color: #ffffff !important;
      }

      /* Light mode styles */
      #prompt-tracker-sidebar.light-mode .sidebar-header {
        background: rgba(250, 250, 250, 0.95);
        border-color: rgba(0, 0, 0, 0.08);
      }

      #prompt-tracker-sidebar.light-mode .sidebar-header h3 {
        color: #1f2937 !important;
      }

      #prompt-tracker-sidebar.light-mode .prompt-count {
        color: #6b7280 !important;
      }

      #prompt-tracker-sidebar.light-mode .header-btn {
        background: rgba(0, 0, 0, 0.05);
        border-color: rgba(0, 0, 0, 0.1);
        color: #374151 !important;
      }

      #prompt-tracker-sidebar.light-mode .header-btn:hover {
        background: rgba(0, 0, 0, 0.1);
        border-color: rgba(0, 0, 0, 0.15);
        color: #1f2937 !important;
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
        color: #9ca3af !important;
        background: rgba(30, 30, 30, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        margin: 0 12px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }

      #prompt-tracker-sidebar.light-mode .empty-state {
        color: #6b7280 !important;
        background: rgba(250, 250, 250, 0.9);
        border-color: rgba(0, 0, 0, 0.08);
      }

      #prompt-tracker-sidebar .empty-icon {
        font-size: 32px;
        margin-bottom: 12px;
        opacity: 0.6;
      }

      #prompt-tracker-sidebar .empty-text {
        font-size: 16px;
        font-weight: 500;
        color: #d1d5db !important;
        margin-bottom: 4px;
      }

      #prompt-tracker-sidebar.light-mode .empty-text {
        color: #374151 !important;
      }

      #prompt-tracker-sidebar .empty-subtext {
        font-size: 13px;
        color: #6b7280 !important;
        margin-bottom: 16px;
      }

      #prompt-tracker-sidebar.light-mode .empty-subtext {
        color: #9ca3af !important;
      }

      #prompt-tracker-sidebar .empty-refresh-hint {
        font-size: 12px;
        color: #60a5fa !important;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 6px;
        padding: 8px 12px;
        margin-top: 12px;
        font-style: italic;
      }

      #prompt-tracker-sidebar.light-mode .empty-refresh-hint {
        color: #3b82f6 !important;
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

      #prompt-tracker-sidebar.light-mode .prompt-card {
        background: rgba(250, 250, 250, 0.9);
        border-color: rgba(0, 0, 0, 0.08);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      #prompt-tracker-sidebar .prompt-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        border-color: rgba(255, 255, 255, 0.12);
        background: rgba(45, 45, 45, 0.9);
      }

      #prompt-tracker-sidebar.light-mode .prompt-card:hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        border-color: rgba(0, 0, 0, 0.12);
        background: rgba(255, 255, 255, 0.95);
      }

      /* Prompt content */
      #prompt-tracker-sidebar .prompt-content {
        font-size: 14px;
        line-height: 1.5;
        color: #e0e0e0 !important;
        white-space: pre-wrap;
        word-break: break-word;
        position: relative;
        min-height: 40px;
        max-height: 100px;
        overflow: hidden;
        margin-bottom: 0;
        display: block !important;
        visibility: visible !important;
        flex-grow: 1;
      }

      #prompt-tracker-sidebar.light-mode .prompt-content {
        color: #374151 !important;
      }

      #prompt-tracker-sidebar .prompt-content::before {
        content: attr(data-number) ". ";
        font-weight: 600;
        color: #a0a0a0 !important;
        margin-right: 8px;
      }

      #prompt-tracker-sidebar.light-mode .prompt-content::before {
        color: #888888 !important;
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

      #prompt-tracker-sidebar.light-mode .prompt-content.long::after {
        background: linear-gradient(to bottom, transparent, rgba(250, 250, 250, 1));
      }

      /* Prompt actions */
      #prompt-tracker-sidebar .prompt-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 6px;
        margin-top: auto;
        margin-bottom: 1px;
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
        color: #a0a0a0 !important;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        min-width: 28px;
        min-height: 28px;
        flex-shrink: 0;
      }

      #prompt-tracker-sidebar.light-mode .copy-btn {
        color: #6b7280 !important;
      }

      #prompt-tracker-sidebar .copy-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #e0e0e0 !important;
        opacity: 1;
      }

      #prompt-tracker-sidebar.light-mode .copy-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #374151 !important;
      }

      /* Copy toast notification */
      #prompt-tracker-sidebar .copy-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white !important;
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
        color: white !important;
      }

      /* Prompt highlight animation */
      .prompt-highlight {
        animation: promptPulse 0.6s ease-in-out;
      }

      @keyframes promptPulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
        50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0.2); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(sidebar);

  // Add click-outside-to-close functionality (ensure single listener)
  if (!window.promptTrackerClickListener) {
    const clickOutsideHandler = (e) => {
      const sidebar = document.getElementById("prompt-tracker-sidebar");
      const toggleButton = document.getElementById("prompt-sidebar-toggle");
      const backupToggle = document.getElementById("prompt-sidebar-toggle-nav");
      const darkModeToggle = document.getElementById("darkModeToggle");
      
      // Check if sidebar is open
      if (sidebar && sidebar.style.right === "0px") {
        // Check if click is outside sidebar and not on any toggle button
        const clickedOnSidebar = sidebar.contains(e.target);
        const clickedOnMainToggle = toggleButton?.contains(e.target);
        const clickedOnBackupToggle = backupToggle?.contains(e.target);
        const clickedOnDarkModeToggle = darkModeToggle?.contains(e.target);
        const clickedOnToggleButton = clickedOnMainToggle || clickedOnBackupToggle;
        
        // Additional check: make sure the click target is not any toggle button
        const isToggleButtonElement = e.target.id === "prompt-sidebar-toggle" || 
                                    e.target.id === "prompt-sidebar-toggle-nav" ||
                                    e.target.id === "darkModeToggle" ||
                                    e.target.closest("#prompt-sidebar-toggle") ||
                                    e.target.closest("#prompt-sidebar-toggle-nav") ||
                                    e.target.closest("#darkModeToggle");
        
        if (!clickedOnSidebar && !clickedOnToggleButton && !clickedOnDarkModeToggle && !isToggleButtonElement) {
          // Close the sidebar
          sidebar.style.right = "-323px";
          sidebar.style.pointerEvents = "none";
          
          // Show the main toggle button again
          if (toggleButton) {
            toggleButton.style.opacity = "1";
            toggleButton.style.visibility = "visible";
            toggleButton.style.pointerEvents = "auto";
          }
        }
      }
    };
    
    document.addEventListener('click', clickOutsideHandler);
    window.promptTrackerClickListener = clickOutsideHandler;
  }

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
          <div class="empty-refresh-hint">💡 If you have prompts but they're not showing, try refreshing the page</div>
        </div>
      `;
      return;
    }

    promptList.innerHTML = prompts.map((prompt, index) => `
      <div class="prompt-card ${prompt.content.length > 200 ? 'long' : ''}" data-id="${prompt.id}" data-target-prompt="${prompt.id}" style="cursor: pointer;" title="Click to jump to this prompt">
        <div class="prompt-content" data-number="${index + 1}">${prompt.content}</div>
        <div class="prompt-actions">
          <button class="copy-btn" title="Copy prompt" data-prompt="${encodeURIComponent(prompt.content)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners for buttons and cards
    sidebar.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click when clicking copy button
        const content = decodeURIComponent(btn.dataset.prompt);
        navigator.clipboard.writeText(content).then(() => {
          showCopyToast();
        });
      });
    });

    // Add click listener to prompt cards for jumping
    sidebar.querySelectorAll('.prompt-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on the copy button
        if (e.target.closest('.copy-btn')) return;
        
        const promptId = card.dataset.targetPrompt;
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
    console.log('=== JUMP TO PROMPT DEBUG ===');
    console.log('Target prompt ID:', promptId);
    
    // Debug: Check what elements exist (excluding our own buttons)
    const allElementsWithId = document.querySelectorAll('[data-prompt-id]:not(button)');
    console.log('Total message elements with data-prompt-id:', allElementsWithId.length);
    allElementsWithId.forEach((el, i) => {
      console.log(`Message ${i}: ID=${el.dataset.promptId}, text=${el.innerText.substring(0, 50)}...`);
    });
    
    // Check if we have the current prompts in memory
    console.log('Current prompts in memory:', currentPrompts.length);
    const targetPrompt = currentPrompts.find(p => p.id === promptId);
    console.log('Target prompt in memory:', targetPrompt ? `Found: ${targetPrompt.content.substring(0, 50)}...` : 'Not found');
    
    // First try to find by data-prompt-id attribute, but exclude our own buttons
    let promptElement = document.querySelector(`[data-prompt-id="${promptId}"]:not(button)`);
    console.log('Found by data-prompt-id (excluding buttons):', !!promptElement);
    
    // If not found, try to find in the promptIdMap
    if (!promptElement) {
      console.log('Element not found by data-prompt-id, searching through all messages...');
      
      // Look through all user messages to find the one with matching ID
      const userMessages = document.querySelectorAll('div[data-message-author-role="user"]');
      console.log('Total user messages found:', userMessages.length);
      
      for (const msg of userMessages) {
        const msgId = promptIdMap.get(msg) || msg.dataset.promptId;
        if (msgId === promptId) {
          promptElement = msg;
          console.log('Found in user messages by WeakMap/dataset');
          break;
        }
      }
      
      // If still not found, try alternative selectors and text matching
      if (!promptElement && targetPrompt) {
        console.log('Trying text matching as fallback...');
        const allMessages = document.querySelectorAll('div[data-message-author-role="user"], div[class*="group"], div[class*="conversation-turn"]');
        
        for (const msg of allMessages) {
          const msgText = msg.innerText.trim();
          // Check if text content matches (first 100 chars for comparison)
          if (msgText && targetPrompt.content && 
              msgText.substring(0, 100) === targetPrompt.content.substring(0, 100)) {
            promptElement = msg;
            console.log('Found by text matching!');
            // Update the element with the correct ID for future use
            msg.dataset.promptId = promptId;
            promptIdMap.set(msg, promptId);
            break;
          }
        }
      }
    }
    
    if (promptElement) {
      console.log('SUCCESS: Found prompt element, scrolling and highlighting');
      
      // Remove any existing highlights
      document.querySelectorAll('.prompt-highlight').forEach(el => {
        el.classList.remove('prompt-highlight');
        el.style.backgroundColor = '';
        el.style.border = '';
        el.style.borderRadius = '';
      });
      
      // Scroll to the element
      promptElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Add highlight class and temporary highlighting
      promptElement.classList.add('prompt-highlight');
      promptElement.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
      promptElement.style.border = '2px solid rgba(59, 130, 246, 0.5)';
      promptElement.style.borderRadius = '8px';
      promptElement.style.transition = 'all 0.3s ease';
      
      // Remove highlighting after 3 seconds
      setTimeout(() => {
        promptElement.style.backgroundColor = '';
        promptElement.style.border = '';
        promptElement.style.borderRadius = '';
        promptElement.classList.remove('prompt-highlight');
      }, 3000);
      
      // Note: Sidebar remains open after jumping to allow users to click more prompts
    } else {
      console.error('FAILED: Prompt element not found for ID:', promptId);
      console.log('=== END JUMP DEBUG ===');
      
      // Force re-scan of prompts to update IDs
      const convoId = getConversationId();
      if (convoId) {
        console.log('Re-scanning prompts to update IDs...');
        // Trigger the mutation observer manually by dispatching a custom DOM change
        const tempDiv = document.createElement('div');
        document.body.appendChild(tempDiv);
        document.body.removeChild(tempDiv);
      }
    }
    
    console.log('=== END JUMP DEBUG ===');
  }

  // Dark mode toggle functionality
  const darkModeToggle = sidebar.querySelector('#darkModeToggle');
  const closeSidebar = sidebar.querySelector('#closeSidebar');
  
  // Function to update main toggle button colors
  function updateMainToggleColors() {
    const mainToggle = document.getElementById("prompt-sidebar-toggle");
    if (mainToggle) {
      mainToggle.style.background = isDarkMode ? "rgba(40, 40, 40, 0.95)" : "rgba(255, 255, 255, 0.95)";
      mainToggle.style.borderColor = isDarkMode ? "rgba(80, 80, 80, 0.3)" : "rgba(0, 0, 0, 0.08)";
      mainToggle.style.color = isDarkMode ? "#e0e0e0" : "#374151";
      mainToggle.style.boxShadow = isDarkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.1)";
    }
  }
  
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation(); // Prevent any event bubbling
      
      console.log("Dark mode toggle clicked - preventing sidebar close");
      
      isDarkMode = !isDarkMode;
      
      // Update sidebar classes
      if (isDarkMode) {
        sidebar.classList.remove('light-mode');
        sidebar.classList.add('dark-mode');
        
        // Update toggle icon to moon
        darkModeToggle.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        `;
      } else {
        sidebar.classList.remove('dark-mode');
        sidebar.classList.add('light-mode');
        
        // Update toggle icon to sun
        darkModeToggle.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        `;
      }
      
      // Update main toggle button colors
      updateMainToggleColors();
      
      // Save preference
      chrome.storage.local.set({ darkMode: isDarkMode });
    });
  }
  
  if (closeSidebar) {
    closeSidebar.addEventListener('click', () => {
      sidebar.style.right = "-323px";
      sidebar.style.pointerEvents = "none";
      
      // Show the main toggle button again
      const mainToggle = document.getElementById("prompt-sidebar-toggle");
      if (mainToggle) {
        mainToggle.style.opacity = "1";
        mainToggle.style.visibility = "visible";
        mainToggle.style.pointerEvents = "auto";
      }
    });
  }
  
  // Load saved dark mode preference
  chrome.storage.local.get(['darkMode'], (result) => {
    if (result.darkMode !== undefined) {
      isDarkMode = result.darkMode;
      
      if (isDarkMode) {
        sidebar.classList.add('dark-mode');
        if (darkModeToggle) {
          darkModeToggle.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          `;
        }
      } else {
        sidebar.classList.add('light-mode');
      }
    } else {
      // Default to dark mode
      sidebar.classList.add('dark-mode');
      isDarkMode = true;
    }
    
    // Update main toggle button colors based on loaded preference
    updateMainToggleColors();
  });

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
  
  // Remove existing backup toggle if present
  const existingNavToggle = document.getElementById("prompt-sidebar-toggle-nav");
  if (existingNavToggle) {
    existingNavToggle.remove();
  }

  console.log("Creating toggle button...");
  
  // Ensure sidebar exists before creating button
  const sidebar = document.getElementById("prompt-tracker-sidebar");
  if (!sidebar) {
    console.log("Sidebar not found, creating it first...");
    injectSidebar();
    return; // injectSidebar will call createToggleButton again
  }

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
  
  toggle.style.cssText = `
    position: fixed !important;
    top: 64px !important;
    right: 30px !important;
    z-index: 99999 !important;
    padding: 8px !important;
    background: ${isDarkMode ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
    border: 1px solid ${isDarkMode ? 'rgba(80, 80, 80, 0.3)' : 'rgba(0, 0, 0, 0.08)'} !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 8px ${isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'} !important;
    cursor: pointer !important;
    backdrop-filter: blur(12px) !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: ${isDarkMode ? '#e0e0e0' : '#374151'} !important;
    transition: all 0.2s ease !important;
    user-select: none !important;
    width: 32px !important;
    height: 32px !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
  `;
  
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation(); // Stop all event propagation
    
    console.log("Main toggle button clicked - preventing all propagation");
    
    // Add a small delay to ensure this event is fully processed before any other events
    setTimeout(() => {
      const sidebar = document.getElementById("prompt-tracker-sidebar");
      
      // Check if sidebar exists before trying to access its properties
      if (!sidebar) {
        console.error("Sidebar not found! Attempting to recreate...");
        // Try to recreate the sidebar
        injectSidebar();
        return;
      }
      
      const isOpen = sidebar.style.right === "0px";
      console.log("Toggle clicked, sidebar isOpen:", isOpen);
      
      // Only open the sidebar if it's closed, don't close it
      if (!isOpen) {
        console.log("Opening sidebar...");
        sidebar.style.right = "0px";
        sidebar.style.pointerEvents = "auto";
        
        // Hide the toggle button when sidebar opens
        toggle.style.opacity = "0";
        toggle.style.visibility = "hidden";
        toggle.style.pointerEvents = "none";
      } else {
        console.log("Sidebar already open, ignoring click");
      }
      // If sidebar is already open, do nothing (don't close it)
    }, 0);
    
    return false; // Additional prevention
  }, true); // Use capture phase

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
    
    // Add the same click event handler to backup button
    navToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation(); // Stop all event propagation
      
      console.log("Backup toggle button clicked - preventing all propagation");
      
      const sidebar = document.getElementById("prompt-tracker-sidebar");
      
      // Check if sidebar exists before trying to access its properties
      if (!sidebar) {
        console.error("Sidebar not found! Attempting to recreate...");
        // Try to recreate the sidebar
        injectSidebar();
        return;
      }
      
      const isOpen = sidebar.style.right === "0px";
      console.log("Backup toggle clicked, sidebar isOpen:", isOpen);
      
      // Only open the sidebar if it's closed, don't close it
      if (!isOpen) {
        console.log("Opening sidebar via backup button...");
        sidebar.style.right = "0px";
        sidebar.style.pointerEvents = "auto";
        
        // Hide the main toggle button when sidebar opens
        const mainToggle = document.getElementById("prompt-sidebar-toggle");
        if (mainToggle) {
          mainToggle.style.opacity = "0";
          mainToggle.style.visibility = "hidden";
          mainToggle.style.pointerEvents = "none";
        }
      } else {
        console.log("Sidebar already open, ignoring backup click");
      }
      // If sidebar is already open, do nothing (don't close it)
      
      return false; // Additional prevention
    }, true); // Use capture phase
    
    navContainer.appendChild(navToggle);
    console.log("Backup button created in nav");
  }
  
  // Check if button is still present every 5 seconds and recreate if missing
  setTimeout(() => {
    const checkButton = () => {
      const buttonExists = document.getElementById("prompt-sidebar-toggle");
      const sidebarExists = document.getElementById("prompt-tracker-sidebar");
      
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
      }
      
      if (!sidebarExists) {
        console.log("Sidebar disappeared, recreating...");
        injectSidebar();
      }
      
      if (buttonExists || sidebarExists) {
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
  const sidebar = document.getElementById("prompt-tracker-sidebar");
  
  if (!button) {
    console.log("Button removed by DOM changes, recreating...");
    createToggleButton();
  }
  
  if (!sidebar) {
    console.log("Sidebar removed by DOM changes, recreating...");
    injectSidebar();
  }
});

// Start observing the document body for child list changes
buttonObserver.observe(document.body, {
  childList: true,
  subtree: true
});

console.log("Button and sidebar observer started");

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
const chatObserver = new MutationObserver((mutations) => {
  console.log('DOM mutation detected, checking for prompts...');
  checkForNewPrompts();
});

// ===== Function to check for new prompts =====
function checkForNewPrompts() {
  const convoId = getConversationId();
  console.log('Checking for prompts in conversation:', convoId);
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
}

const chatContainer = document.querySelector("main");
if (chatContainer) {
  chatObserver.observe(chatContainer, { childList: true, subtree: true });
  console.log("Chat observer started");
}

// ===== Real-time prompt detection =====
// Check for new prompts every 3 seconds
setInterval(() => {
  checkForNewPrompts();
}, 3000);

// Also check when user stops typing (after input events)
let typingTimer;
document.addEventListener('input', () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    console.log('User stopped typing, checking for new prompts...');
    checkForNewPrompts();
  }, 1000);
});

// Check when Enter key is pressed (likely sending a prompt)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    setTimeout(() => {
      console.log('Enter pressed, checking for new prompts...');
      checkForNewPrompts();
    }, 2000); // Wait 2 seconds for the message to appear
  }
});

// Check when clicking send button
document.addEventListener('click', (e) => {
  const target = e.target;
  if (target.matches('button[data-testid="send-button"], button[aria-label*="Send"], button[title*="Send"]') ||
      target.closest('button[data-testid="send-button"], button[aria-label*="Send"], button[title*="Send"]')) {
    setTimeout(() => {
      console.log('Send button clicked, checking for new prompts...');
      checkForNewPrompts();
    }, 2000);
  }
});

// ===== URL Change Observer for Conversation Switching =====
let lastUrl = window.location.href;
console.log("Initial URL:", lastUrl);
console.log("Initial conversation ID:", getConversationId());

// Check for URL changes (conversation switching)
const urlObserver = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    console.log("URL changed from:", lastUrl, "to:", currentUrl);
    lastUrl = currentUrl;
    
    const newConvoId = getConversationId();
    console.log("New conversation ID:", newConvoId);
    
    if (newConvoId !== currentConversationId) {
      console.log("Conversation changed! Switching from", currentConversationId, "to", newConvoId);
      currentConversationId = newConvoId;
      currentPrompts = [];
      postPromptsToSidebar([]);
      
      if (newConvoId) {
        loadPromptsFromStorage(newConvoId);
      }
    }
  }
});

// Observe document changes that might indicate navigation
urlObserver.observe(document, { subtree: true, childList: true });

// Also listen for popstate events (back/forward navigation)
window.addEventListener('popstate', () => {
  console.log("Popstate event detected");
  setTimeout(() => {
    const newConvoId = getConversationId();
    console.log("Popstate - New conversation ID:", newConvoId);
    
    if (newConvoId !== currentConversationId) {
      console.log("Popstate - Conversation changed!");
      currentConversationId = newConvoId;
      currentPrompts = [];
      postPromptsToSidebar([]);
      
      if (newConvoId) {
        loadPromptsFromStorage(newConvoId);
        setTimeout(() => checkForNewPrompts(), 500);
      }
    }
  }, 100); // Small delay to ensure URL has changed
});

// Listen for hash changes and URL changes
window.addEventListener('hashchange', () => {
  console.log("Hash change detected");
  setTimeout(() => {
    const newConvoId = getConversationId();
    if (newConvoId !== currentConversationId) {
      console.log("Hash change - Conversation changed!");
      currentConversationId = newConvoId;
      currentPrompts = [];
      postPromptsToSidebar([]);
      
      if (newConvoId) {
        loadPromptsFromStorage(newConvoId);
        setTimeout(() => checkForNewPrompts(), 500);
      }
    }
  }, 100);
});

// Check for conversation changes every 1 second as backup (more frequent)
setInterval(() => {
  const currentConvoId = getConversationId();
  if (currentConvoId !== currentConversationId) {
    console.log("Interval check - Conversation changed from", currentConversationId, "to", currentConvoId);
    currentConversationId = currentConvoId;
    currentPrompts = [];
    postPromptsToSidebar([]);
    
    if (currentConvoId) {
      loadPromptsFromStorage(currentConvoId);
      // Also trigger an immediate prompt check for the new conversation
      setTimeout(() => checkForNewPrompts(), 500);
    }
  }
}, 1000); // Changed from 2000ms to 1000ms for faster detection

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
