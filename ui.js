/**
 * @file Simplified UI management for Prompt Tracker extension.
 */

/**
 * Applies theme to UI elements.
 */
async function applyTheme(theme) {
  currentTheme = theme;
  const isDark = theme === 'dark';
  document.body.classList.remove('theme-dark', 'theme-light');
  document.body.classList.add(isDark ? 'theme-dark' : 'theme-light');

  const themeToggle = document.getElementById("theme-toggle-button");
  if (themeToggle) {
    const icons = await loadIcons();
    themeToggle.innerHTML = icons ? (isDark ? icons.themeSun : icons.themeMoon) : (isDark ? "☀" : "🌙");
  }
}

/**
 * Injects sidebar from external HTML.
 */
async function injectSidebar() {
  if (document.getElementById("prompt-tracker-sidebar")) return;

  try {
    const response = await fetch(chrome.runtime.getURL('sidebar.html'));
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const sidebar = doc.querySelector('#prompt-tracker-sidebar');
    
    if (sidebar) {
      sidebar.style.width = `${SIDEBAR_DEFAULT_WIDTH}px`;
      sidebar.style.right = sidebarHiddenRightPos;
      document.body.appendChild(sidebar);
    }
  } catch (error) {
    // Silently fail for production
  }
}

/**
 * Loads icons from external file.
 */
async function loadIcons() {
  if (window.promptTrackerIcons) return window.promptTrackerIcons;
  
  try {
    const response = await fetch(chrome.runtime.getURL('icons.html'));
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    window.promptTrackerIcons = {
      toggleOpen: doc.querySelector('.toggle-open-icon')?.innerHTML,
      toggleClose: doc.querySelector('.toggle-close-icon')?.innerHTML,
      themeSun: doc.querySelector('.theme-sun-icon')?.innerHTML,
      themeMoon: doc.querySelector('.theme-moon-icon')?.innerHTML
    };
    
    return window.promptTrackerIcons;
  } catch (error) {
    return null;
  }
}

/**
 * Creates toggle button (open).
 */
async function createToggleButton() {
  const existing = document.getElementById("prompt-sidebar-toggle");
  if (existing) existing.remove();
  
  const toggle = document.createElement("button");
  toggle.id = "prompt-sidebar-toggle";
  
  const icons = await loadIcons();
  toggle.innerHTML = icons?.toggleOpen || "☰";
  
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleOpenSidebar();
  });
  
  document.body.appendChild(toggle);
}

/**
 * Creates close button.
 */
async function createCloseButton() {
  const existing = document.getElementById("prompt-sidebar-close");
  if (existing) existing.remove();
  
  const close = document.createElement("button");
  close.id = "prompt-sidebar-close";
  
  const icons = await loadIcons();
  close.innerHTML = icons?.toggleClose || "✕";
  
  close.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleCloseSidebar();
  });
  
  document.body.appendChild(close);
}

/**
 * Creates theme toggle button.
 */
async function createThemeToggle() {
  const existing = document.getElementById("theme-toggle-button");
  if (existing) existing.remove();

  const themeToggle = document.createElement("button");
  themeToggle.id = "theme-toggle-button";
  themeToggle.title = "Toggle Theme";
  themeToggle.addEventListener('click', handleThemeToggle);
  document.body.appendChild(themeToggle);
}

/**
 * Creates UUID copy button.
 */
async function createUUIDCopyButton() {
  const existing = document.getElementById("uuid-copy-button");
  if (existing) existing.remove();

  const uuidButton = document.createElement("button");
  uuidButton.id = "uuid-copy-button";
  uuidButton.title = "Copy UUID";
  uuidButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>`;
  uuidButton.addEventListener('click', handleUUIDCopy);
  document.body.appendChild(uuidButton);
}

/**
 * Handles opening the sidebar.
 */
async function handleOpenSidebar() {
  if (window.promptTrackerToggling) return;
  window.promptTrackerToggling = true;
  
  try {
    let sidebar = document.getElementById("prompt-tracker-sidebar");
    if (!sidebar) {
      await injectSidebar();
      sidebar = document.getElementById("prompt-tracker-sidebar");
    }
    
    const openButton = document.getElementById("prompt-sidebar-toggle");
    const closeButton = document.getElementById("prompt-sidebar-close");
    const themeToggle = document.getElementById("theme-toggle-button");
    const uuidButton = document.getElementById("uuid-copy-button");

    if (!sidebar || !openButton || !closeButton) return;

    // Hide open button
    openButton.classList.add('hidden');

    // Trigger bounce animation and show sidebar
    sidebar.classList.add('bounce-in');
    sidebar.style.right = "15px";
    sidebar.style.pointerEvents = "auto";
    if (themeToggle) {
      themeToggle.style.right = '75px';
    }
    if (uuidButton) {
      uuidButton.style.right = '110px';
    }
    
    // Remove bounce class after animation completes
    setTimeout(() => {
      sidebar.classList.remove('bounce-in');
    }, 300);
    
    // Show close button with slight delay for better visual flow
    setTimeout(() => {
      closeButton.classList.add('visible');
    }, 100);
    
    await applyTheme(currentTheme);
  } finally {
    window.promptTrackerToggling = false;
  }
}

/**
 * Handles closing the sidebar.
 */
async function handleCloseSidebar() {
  if (window.promptTrackerToggling) return;
  window.promptTrackerToggling = true;
  
  try {
    const sidebar = document.getElementById("prompt-tracker-sidebar");
    const openButton = document.getElementById("prompt-sidebar-toggle");
    const closeButton = document.getElementById("prompt-sidebar-close");
    const themeToggle = document.getElementById("theme-toggle-button");
    const uuidButton = document.getElementById("uuid-copy-button");

    if (!sidebar || !openButton || !closeButton) return;

    // Hide close button, theme toggle, and UUID button
    closeButton.classList.remove('visible');
    if (themeToggle) {
      themeToggle.style.right = '-100px';
    }
    if (uuidButton) {
      uuidButton.style.right = '-100px';
    }
    
    // Hide sidebar
    sidebar.style.right = sidebarHiddenRightPos;
    sidebar.style.pointerEvents = "none";
    
    // Show open button
    setTimeout(() => {
      openButton.classList.remove('hidden');
    }, 100);
    
    await applyTheme(currentTheme);
  } finally {
    window.promptTrackerToggling = false;
  }
}

/**
 * Handles theme toggle.
 */
function handleThemeToggle() {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  chrome.storage.local.set({ [THEME_STORAGE_KEY]: newTheme }, () => {
    applyTheme(newTheme);
  });
}

/**
 * Handles UUID copy.
 */
async function handleUUIDCopy() {
  try {
    const uuid = await getUUID();
    if (uuid) {
      await navigator.clipboard.writeText(uuid);
      showCopyToast('UUID copied to clipboard!');
    } else {
      showCopyToast('UUID not found. Try reloading.', true);
    }
  } catch (err) {
    showCopyToast('Failed to copy UUID', true);
  }
}

/**
 * Adds click-outside handler.
 */
function addClickOutsideHandler() {
  if (window.promptTrackerClickListener) {
    document.removeEventListener('click', window.promptTrackerClickListener);
  }
  
  const handler = (e) => {
    if (window.promptTrackerToggling) return;
    
    const sidebar = document.getElementById("prompt-tracker-sidebar");
    if (!sidebar || sidebar.style.right !== "15px") return;
    
    const isClickOutside = !sidebar.contains(e.target) && 
                          !e.target.closest("#prompt-sidebar-toggle") &&
                          !e.target.closest("#prompt-sidebar-close") &&
                          !e.target.closest("#theme-toggle-button");
    
    if (isClickOutside) handleCloseSidebar();
  };
  
  document.addEventListener('click', handler);
  window.promptTrackerClickListener = handler;
}

/**
 * Main initialization function.
 */
async function initializeExtensionUI() {
  // Remove existing listeners
  if (window.promptTrackerClickListener) {
    document.removeEventListener('click', window.promptTrackerClickListener);
    window.promptTrackerClickListener = null;
  }
  
  // Load resources and create UI
  await loadIcons();
  await injectSidebar();
  await createToggleButton();
  await createCloseButton();
  await createThemeToggle();
  await createUUIDCopyButton();
  addClickOutsideHandler();

  return true;
}

// Keep the rest of the functions for templates and display
async function loadTemplates() {
  if (window.promptTrackerTemplates) return window.promptTrackerTemplates;
  
  try {
    const response = await fetch(chrome.runtime.getURL('templates.html'));
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    window.promptTrackerTemplates = {
      emptyState: doc.querySelector('.empty-state-template')?.innerHTML,
      promptCard: doc.querySelector('.prompt-card-template')?.innerHTML
    };
    
    return window.promptTrackerTemplates;
  } catch (error) {
    return null;
  }
}

async function updatePromptsDisplay(prompts) {
  const promptList = document.getElementById('promptList');
  const promptCountEl = document.getElementById('promptCount');
  if (!promptList || !promptCountEl) return;

  promptCountEl.textContent = prompts.length;
  if (prompts.length === 0) {
    const templates = await loadTemplates();
    promptList.innerHTML = templates?.emptyState || '<div class="empty-state">No prompts yet</div>';
  } else {
    const templates = await loadTemplates();
    if (templates?.promptCard) {
      const promptCards = prompts.map((prompt, index) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = templates.promptCard;
        
        const card = tempDiv.querySelector('.prompt-card');
        const content = tempDiv.querySelector('.prompt-content');
        const copyBtn = tempDiv.querySelector('.copy-btn');
        
        card.setAttribute('data-target-prompt', prompt.id);
        content.setAttribute('data-number', index + 1);
        content.textContent = prompt.content;
        copyBtn.setAttribute('data-prompt', encodeURIComponent(prompt.content));
        
        return tempDiv.innerHTML;
      }).join('');
      
      promptList.innerHTML = promptCards;
    } else {
      promptList.innerHTML = prompts.map((prompt, index) => 
        `<div class="prompt-card"><div class="prompt-content">${index + 1}. ${prompt.content}</div></div>`
      ).join('');
    }
  }
}

function jumpToPrompt(promptId) {
  // Look for prompt with data-prompt-id attribute
  const targetPrompt = document.querySelector(`[data-prompt-id="${promptId}"]`);
  if (targetPrompt) {
    targetPrompt.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add highlight class
    targetPrompt.classList.add('prompt-highlight');
    
    // Remove highlight after 1 second
    setTimeout(() => {
      targetPrompt.classList.remove('prompt-highlight');
    }, 1000);
  }
}

function showCopyToast(message = 'Text copied to clipboard!', isError = false) {
  // Remove existing toast if present
  const existingToast = document.getElementById('prompt-copy-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast element
  const toast = document.createElement('div');
  toast.id = 'prompt-copy-toast';
  toast.className = 'prompt-copy-toast';
  if (isError) toast.classList.add('error');

  const icon = isError
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>';

  toast.innerHTML = `${icon}${message}`;

  document.body.appendChild(toast);

  // Auto-remove after 3 seconds with slide out animation
  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.style.animation = 'slideOutDown 0.3s ease-in';
      setTimeout(() => {
        if (toast && toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 3000);
}

function attachCardListeners() {
  // Remove existing listeners first to prevent duplicates
  const existingHandler = window.promptTrackerCardHandler;
  if (existingHandler) {
    document.removeEventListener('click', existingHandler);
  }
  
  const cardHandler = (e) => {
    // Handle copy button click first (prevent event bubbling to card)
    if (e.target.closest('.copy-btn')) {
      e.stopPropagation(); // Prevent card click
      const copyBtn = e.target.closest('.copy-btn');
      const promptText = decodeURIComponent(copyBtn.dataset.prompt);
      
      navigator.clipboard.writeText(promptText).then(() => {
        showCopyToast();
      }).catch(err => {
        // Silently fail for production
      });
    } 
    // Handle card click (but not if copy button was clicked)
    else if (e.target.closest('.prompt-card')) {
      const card = e.target.closest('.prompt-card');
      const promptId = card.dataset.targetPrompt;
      
      if (promptId) {
        jumpToPrompt(promptId);
      }
    }
  };
  
  document.addEventListener('click', cardHandler);
  window.promptTrackerCardHandler = cardHandler; // Store reference for cleanup
}
