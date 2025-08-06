window.addEventListener("message", (event) => {
  if (event.data?.type === "PROMPTS_UPDATED") {
    updatePromptList(event.data.prompts);
  }
});

// function updatePromptList(prompts) {
//   const container = document.getElementById("promptList");
//   container.innerHTML = "";

//   prompts.forEach((prompt, index) => {
//     const div = document.createElement("div");
//     div.className = "prompt";
//     div.textContent = `${index + 1}. ${prompt.text}`;
//     div.dataset.promptId = prompt.id;

//     div.addEventListener("click", () => {
//       window.parent.postMessage({ type: "JUMP_TO_PROMPT", promptId: prompt.id }, "*");
//     });

//     container.appendChild(div);
//   });
// }


function updatePromptList(prompts) {
  const container = document.getElementById("promptList");
  container.innerHTML = "";

  prompts.forEach((prompt, index) => {
    const div = document.createElement("div");
    const shortText = prompt.text.trim();

    div.className = "prompt";
    div.textContent = `${index + 1}. ${prompt.text}`;
    div.dataset.promptId = prompt.id;

    // Add fade class if long
    if (shortText.length > 200) {
      div.classList.add("long");

      const ellipsis = document.createElement("div");
      ellipsis.className = "fade-ellipsis";
      ellipsis.textContent = "…";
      div.appendChild(ellipsis);
    }

    div.addEventListener("click", () => {
      const mainWindow = window.parent;
      mainWindow.postMessage({ type: "JUMP_TO_PROMPT", promptId: prompt.id }, "*");
    });

    container.appendChild(div);
  });
}


