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

// ===== Helper: Post to Sidebar Frame =====
function postPromptsToSidebar(prompts) {
  const sidebar = document.getElementById("prompt-tracker-sidebar");
  if (sidebar) {
    sidebar.contentWindow.postMessage({ type: "PROMPTS_UPDATED", prompts }, "*");
  }
}

// ===== Helper: Generate Unique Prompt ID =====
function generatePromptId() {
  return 'prompt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

// ===== Inject Sidebar =====
function injectSidebar() {
  if (document.getElementById("prompt-tracker-sidebar")) return;

  // Create iframe
  const iframe = document.createElement("iframe");
  iframe.id = "prompt-tracker-sidebar";
  iframe.src = chrome.runtime.getURL("sidebar.html");
  
  // Check if dark mode is active for iframe styling
  const isDarkModeForIframe = isDarkModeActive();
  
  iframe.style.cssText = `
    position: fixed;
    top: 0;
    right: -380px; /* Start hidden, wider for better UX */
    width: 360px;
    height: 100%;
    border: none;
    z-index: 9999;
    background: transparent;
    pointer-events: none;
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: ${isDarkModeForIframe ? '-4px 0 20px rgba(0, 0, 0, 0.6)' : '-4px 0 20px rgba(0, 0, 0, 0.1)'};
  `;
  document.body.appendChild(iframe);

  // Create toggle button
  const toggle = document.createElement("button");
  toggle.id = "prompt-sidebar-toggle";
  toggle.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 12l2 2 4-4"/>
      <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1"/>
      <path d="M3 12c-.552 0-1-.448-1-1s.448-1 1-1"/>
      <path d="M12 3c0-.552.448-1 1-1s1 .448 1 1"/>
      <path d="M12 21c0 .552-.448 1-1 1s-1-.448-1-1"/>
      <circle cx="12" cy="12" r="9"/>
    </svg>
    <span style="margin-left: 6px; font-size: 12px; font-weight: 500;">Prompts</span>
  `;
  // Check if dark mode is active
  const isDarkModeForToggle = isDarkModeActive();

  toggle.style.cssText = `
    position: fixed;
    top: 64px;
    right: 16px;
    z-index: 10000;
    padding: 8px 12px;
    background: ${isDarkModeForToggle ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
    border: 1px solid ${isDarkModeForToggle ? 'rgba(80, 80, 80, 0.4)' : 'rgba(0, 0, 0, 0.1)'};
    border-radius: 12px;
    box-shadow: 0 4px 12px ${isDarkModeForToggle ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)'};
    cursor: pointer;
    backdrop-filter: blur(12px);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    color: ${isDarkModeForToggle ? '#e0e0e0' : '#374151'};
    transition: all 0.2s ease;
    user-select: none;
  `;
  
  // Add hover effects
  toggle.addEventListener("mouseenter", () => {
    const isDarkMode = isDarkModeActive();
    
    toggle.style.transform = "translateY(-1px)";
    toggle.style.boxShadow = isDarkMode ? "0 6px 16px rgba(0, 0, 0, 0.6)" : "0 6px 16px rgba(0, 0, 0, 0.2)";
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
    
    const isOpen = iframe.style.right === "0px";
    iframe.style.right = isOpen ? "-380px" : "0px";
    iframe.style.pointerEvents = isOpen ? "none" : "auto";
    
    // Update button appearance and content based on state
    if (isOpen) {
      // Sidebar is closing - show normal button
      toggle.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 12l2 2 4-4"/>
          <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1"/>
          <path d="M3 12c-.552 0-1-.448-1-1s.448-1 1-1"/>
          <path d="M12 3c0-.552.448-1 1-1s1 .448 1 1"/>
          <path d="M12 21c0 .552-.448 1-1 1s-1-.448-1-1"/>
          <circle cx="12" cy="12" r="9"/>
        </svg>
        <span style="margin-left: 6px; font-size: 12px; font-weight: 500;">Prompts</span>
      `;
      toggle.style.background = isDarkMode ? "rgba(40, 40, 40, 0.95)" : "rgba(255, 255, 255, 0.95)";
      toggle.style.color = isDarkMode ? "#e0e0e0" : "#374151";
      toggle.style.top = "64px";
      toggle.style.right = "16px";
    } else {
      // Sidebar is opening - show close button
      toggle.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      toggle.style.background = "rgba(80, 80, 80, 0.95)";
      toggle.style.color = "white";
      toggle.style.top = "16px";
      toggle.style.right = "24px";
    }
  });

  document.body.appendChild(toggle);
}

injectSidebar();

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
    loadPromptsFromStorage(convoId);
  }

  const messages = Array.from(document.querySelectorAll('div[data-message-author-role="user"]'));
  const newPromptData = [];

  for (const msg of messages) {
    if (!msg.dataset.promptId) {
      const promptText = msg.innerText.trim();
      if (!promptText) continue;

      const promptId = generatePromptId();
      msg.dataset.promptId = promptId;

      promptIdMap.set(msg, promptId);

      newPromptData.push({
        id: promptId,
        text: getSmartTrimmedText(promptText),
        fullText: promptText, // Store full text for copying
      });
    } else {
      // Already processed
      const existing = currentPrompts.find(p => p.id === msg.dataset.promptId);
      if (existing) newPromptData.push(existing);
    }
  }

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
