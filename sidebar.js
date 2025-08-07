window.addEventListener("message", (event) => {
  if (event.data?.type === "PROMPTS_UPDATED") {
    updatePromptList(event.data.prompts);
  }
});

// Function to show copy toast
function showCopyToast() {
  const toast = document.getElementById("copyToast");
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// Function to copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showCopyToast();
  } catch (err) {
    console.error('Failed to copy: ', err);
    // Fallback method
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showCopyToast();
    } catch (fallbackErr) {
      console.error('Fallback copy failed: ', fallbackErr);
    }
    document.body.removeChild(textArea);
  }
}

function updatePromptList(prompts) {
  const container = document.getElementById("promptList");
  const countElement = document.getElementById("promptCount");
  
  container.innerHTML = "";
  countElement.textContent = prompts.length;

  if (prompts.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <div class="empty-icon">💬</div>
      <div class="empty-text">No prompts yet</div>
      <div class="empty-subtext">Start a conversation to see your prompts here</div>
    `;
    container.appendChild(emptyState);
    return;
  }

  prompts.forEach((prompt, index) => {
    const promptCard = document.createElement("div");
    promptCard.className = "prompt-card";
    promptCard.dataset.promptId = prompt.id;

    // Get full text for copying (remove the trimming)
    const fullText = prompt.fullText || prompt.text; // Use fullText if available, fallback to text
    const displayText = prompt.text; // Use the already trimmed text for display

    promptCard.innerHTML = `
      <div class="prompt-header">
        <span class="prompt-number">#${index + 1}</span>
        <button class="copy-btn" title="Copy prompt">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      <div class="prompt-content">
        ${displayText}
      </div>
      <div class="prompt-actions">
        <button class="jump-btn" title="Jump to prompt">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17l10-10"></path>
            <path d="M7 7h10v10"></path>
          </svg>
          Jump to
        </button>
      </div>
    `;

    // Add fade class if the original full text is long
    const originalFullText = prompt.fullText || prompt.text;
    if (originalFullText.length > 200) {
      promptCard.classList.add("long");
    }

    // Copy button functionality
    const copyBtn = promptCard.querySelector(".copy-btn");
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      copyToClipboard(fullText);
      
      // Visual feedback
      copyBtn.style.background = "#10b981";
      copyBtn.style.color = "white";
      setTimeout(() => {
        copyBtn.style.background = "";
        copyBtn.style.color = "";
      }, 1000);
    });

    // Jump button functionality
    const jumpBtn = promptCard.querySelector(".jump-btn");
    jumpBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.parent.postMessage({ type: "JUMP_TO_PROMPT", promptId: prompt.id }, "*");
    });

    // Card click to jump (alternative to button)
    promptCard.addEventListener("click", (e) => {
      if (!e.target.closest(".copy-btn") && !e.target.closest(".jump-btn")) {
        window.parent.postMessage({ type: "JUMP_TO_PROMPT", promptId: prompt.id }, "*");
      }
    });

    container.appendChild(promptCard);
  });
}


