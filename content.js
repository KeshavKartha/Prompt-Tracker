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
  iframe.style.cssText = `
    position: fixed;
    top: 0;
    right: -320px; /* Start hidden */
    width: 300px;
    height: 100%;
    border: none;
    z-index: 9999;
    background: transparent;
    pointer-events: none;
    transition: right 0.3s ease;
  `;
  document.body.appendChild(iframe);

  // Create toggle button
  const toggle = document.createElement("button");
  toggle.id = "prompt-sidebar-toggle";
  toggle.textContent = "☰";
  toggle.style.cssText = `
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 10000;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.6);
    border: none;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    cursor: pointer;
    backdrop-filter: blur(8px);
  `;
  toggle.addEventListener("click", () => {
    const isOpen = iframe.style.right === "0px";
    iframe.style.right = isOpen ? "-320px" : "0px";
    iframe.style.pointerEvents = isOpen ? "none" : "auto";
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

const MAX_PREVIEW_CHARS = 500;

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
