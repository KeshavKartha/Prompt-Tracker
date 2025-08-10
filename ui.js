/**
 * @file Manages all UI creation, injection, and DOM event handling.
 */

/**
 * Applies the selected theme ('dark' or 'light') to the UI.
 * @param {string} theme The theme to apply.
 */
function applyTheme(theme) {
  currentTheme = theme;
  const isDark = theme === 'dark';

  document.body.classList.remove('theme-dark', 'theme-light');
  document.body.classList.add(isDark ? 'theme-dark' : 'theme-light');

  const mainToggle = document.getElementById("prompt-sidebar-toggle");
  const themeToggle = document.getElementById("theme-toggle-button");

  if (themeToggle) {
    themeToggle.innerHTML = isDark
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    themeToggle.style.background = isDark ? "rgba(40,40,40,0.95)" : "rgba(255,255,255,0.95)";
    themeToggle.style.color = isDark ? "#e0e0e0" : "#374151";
    themeToggle.style.border = `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`;
  }

  if (mainToggle) {
    const isOpen = mainToggle.classList.contains('prompt-toggle-close');
    mainToggle.style.background = isDark ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)';
    mainToggle.style.color = isDark ? '#e0e0e0' : '#374151';
    mainToggle.style.border = `1px solid ${isDark
      ? (isOpen ? 'rgba(255,255,255,0.2)' : 'rgba(80,80,80,0.3)')
      : (isOpen ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.08)')
    }`;
  }
}

/**
 * Creates and injects the main sidebar element into the DOM.
 */
function injectSidebar() {
  if (document.getElementById("prompt-tracker-sidebar")) return;
  const sidebar = document.createElement("div");
  sidebar.id = "prompt-tracker-sidebar";
  sidebar.style.width = `${SIDEBAR_DEFAULT_WIDTH}px`;
  sidebar.style.right = sidebarHiddenRightPos;
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3>Previous Prompts</h3>
      <div class="prompt-count"><span id="promptCount">0</span> prompts</div>
    </div>
    <div id="promptList" class="prompt-list-container"></div>
    <div id="copyToast" class="copy-toast"><span>✓ Copied to clipboard!</span></div>
  `;
  document.body.appendChild(sidebar);
}

/**
 * Creates the floating toggle button to show/hide the sidebar.
 */
function createToggleButton() {
  if (document.getElementById("prompt-sidebar-toggle")) return;
  const toggle = document.createElement("button");
  toggle.id = "prompt-sidebar-toggle";
  toggle.innerHTML = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"></path><path d="M8 12.5L10.5 15L16 9"></path><path d="M12 2V3.5"></path><path d="M12 20.5V22"></path><path d="M22 12H20.5"></path><path d="M3.5 12H2"></path><path d="M4.92893 4.92893L5.99999 6"></path><path d="M18 18L19.0711 19.0711"></path><path d="M19.0711 4.92893L18 6"></path><path d="M6 18L4.92893 19.0711"></path></svg>`;
  toggle.addEventListener("click", handleToggleSidebar);
  document.body.appendChild(toggle);
}

/**
 * Creates the theme toggle button.
 */
function createThemeToggle() {
    if (document.getElementById("theme-toggle-button")) return;
    const themeToggle = document.createElement("button");
    themeToggle.id = "theme-toggle-button";
    themeToggle.title = "Toggle Theme";
    themeToggle.addEventListener('click', handleThemeToggle);
    document.body.appendChild(themeToggle);
}

/**
 * Handles the logic for opening and closing the sidebar.
 */
function handleToggleSidebar() {
    const sidebar = document.getElementById("prompt-tracker-sidebar");
    const mainToggle = document.getElementById("prompt-sidebar-toggle");
    const themeToggle = document.getElementById("theme-toggle-button");
    if (!sidebar || !mainToggle || !themeToggle) return;

    const isOpen = sidebar.style.right === "15px";

    sidebar.style.right = isOpen ? sidebarHiddenRightPos : "15px";
    sidebar.style.pointerEvents = isOpen ? "none" : "auto";
    themeToggle.style.right = isOpen ? '-100px' : '85px';

    if (isOpen) {
        mainToggle.classList.remove('prompt-toggle-close');
        mainToggle.innerHTML = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"></path><path d="M8 12.5L10.5 15L16 9"></path><path d="M12 2V3.5"></path><path d="M12 20.5V22"></path><path d="M22 12H20.5"></path><path d="M3.5 12H2"></path><path d="M4.92893 4.92893L5.99999 6"></path><path d="M18 18L19.0711 19.0711"></path><path d="M19.0711 4.92893L18 6"></path><path d="M6 18L4.92893 19.0711"></path></svg>`;
        mainToggle.style.transform = ''; // Reset transform
    } else {
        mainToggle.classList.add('prompt-toggle-close');
        mainToggle.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    }
    applyTheme(currentTheme);
}

/**
 * Handles the theme toggle button click.
 */
function handleThemeToggle() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    chrome.storage.local.set({ [THEME_STORAGE_KEY]: newTheme }, () => {
        applyTheme(newTheme);
    });
}

/**
 * Scrolls the main page to the corresponding prompt element and highlights it.
 * @param {string} promptId The ID of the prompt to jump to.
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
    promptElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    promptElement.style.transition = 'background-color 0.3s ease, border 0.3s ease';
    promptElement.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
    promptElement.style.border = '2px solid rgba(59, 130, 246, 0.4)';
    promptElement.style.borderRadius = '8px';
    setTimeout(() => {
        promptElement.style.backgroundColor = '';
        promptElement.style.border = '';
        promptElement.style.borderRadius = '';
    }, 3000);
  } else {
    console.error('Prompt Tracker: Could not find element for prompt ID:', promptId);
  }
}

/**
 * Shows a temporary "Copied!" toast notification.
 */
function showCopyToast() {
  const copyToast = document.getElementById('copyToast');
  if (!copyToast) return;
  copyToast.classList.add('show');
  setTimeout(() => copyToast.classList.remove('show'), 2000);
}

/**
 * Attaches click listeners to prompt cards and their copy buttons.
 */
function attachCardListeners() {
  const promptList = document.getElementById('promptList');
  if (!promptList) return;

  promptList.addEventListener('click', (e) => {
    const card = e.target.closest('.prompt-card');
    if (!card) return;

    const copyBtn = e.target.closest('.copy-btn');
    if (copyBtn) {
      e.stopPropagation();
      const content = decodeURIComponent(copyBtn.dataset.prompt);
      navigator.clipboard.writeText(content).then(showCopyToast);
    } else {
      jumpToPrompt(card.dataset.targetPrompt);
    }
  });
}

/**
 * Renders the list of prompts inside the sidebar.
 * @param {Array<Object>} prompts The array of prompt objects to display.
 */
function updatePromptsDisplay(prompts) {
  const promptList = document.getElementById('promptList');
  const promptCountEl = document.getElementById('promptCount');
  if (!promptList || !promptCountEl) return;

  promptCountEl.textContent = prompts.length;

  if (prompts.length === 0) {
    promptList.innerHTML = `<div class="empty-state"><div class="empty-icon">💭</div><div class="empty-text">No prompts yet</div><div class="empty-subtext">Start a conversation to see your prompts here.</div><div class="empty-refresh-hint">💡 If prompts don't appear, try refreshing the page.</div></div>`;
  } else {
    promptList.innerHTML = prompts.map((prompt, index) => `
      <div class="prompt-card" data-target-prompt="${prompt.id}" title="Click to jump to this prompt">
        <div class="prompt-content" data-number="${index + 1}">${prompt.content}</div>
        <div class="prompt-actions">
          <button class="copy-btn" title="Copy prompt" data-prompt="${encodeURIComponent(prompt.content)}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
      </div>`).join('');
  }
}