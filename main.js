import { CreateMLCEngine } from "@mlc-ai/web-llm";

// DOM elements
const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const statusText = document.getElementById("status-text");
const downloadBtn = document.getElementById("download-btn");
const deleteCacheBtn = document.getElementById("delete-cache-btn");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");

// State
let engine = null;
let messages = [];

// Use a small, fast model for demo
// You can swap this with any model from: https://mlc.ai/models
const selectedModel = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

// Initialize the engine
async function initEngine() {
  updateStatus("Loading model... This may take a minute on first run.");
  progressContainer.style.display = "block";
  
  try {
    engine = await CreateMLCEngine(selectedModel, {
      initProgressCallback: (progress) => {
        const percent = Math.round(progress.progress * 100);
        updateStatus(`Loading model: ${percent}% - ${progress.text}`);
        updateProgressBar(percent);
      },
    });
    
    updateStatus("Model loaded! Ready to chat.", true);
    progressContainer.style.display = "none";
    enableInput();
    downloadBtn.style.display = "none";
    addSystemMessage("Model loaded successfully! You can now start chatting.");
  } catch (error) {
    console.error("Failed to initialize engine:", error);
    updateStatus("Failed to load model. Check console for details.");
    progressContainer.style.display = "none";
    addSystemMessage(`Error: ${error.message}. Make sure WebGPU is supported in your browser.`);
  }
}

// Update status indicator
function updateStatus(text, ready = false) {
  const indicator = document.querySelector(".status-indicator");
  
  statusText.textContent = text;
  
  if (ready) {
    indicator.style.background = "#00ff00";
  } else {
    indicator.style.background = "#ffff00";
  }
}

// Update progress bar
function updateProgressBar(percent) {
  progressBar.setAttribute('aria-valuenow', percent);
  progressFill.style.width = `${percent}%`;
}

// Enable input after model loads
function enableInput() {
  userInput.disabled = false;
  sendBtn.disabled = false;
  userInput.focus();
}

// Add message to chat
function addMessage(role, content) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = content;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return messageDiv;
}

// Add system message
function addSystemMessage(content) {
  addMessage("system", content);
}

// Send message and get response
async function sendMessage() {
  const userMessage = userInput.value.trim();
  if (!userMessage || !engine) return;

  // Add user message to chat
  addMessage("user", userMessage);
  messages.push({ role: "user", content: userMessage });
  
  // Clear input
  userInput.value = "";
  userInput.disabled = true;
  sendBtn.disabled = true;

  // Create assistant message placeholder
  const assistantMessageDiv = document.createElement("div");
  assistantMessageDiv.className = "message assistant";
  assistantMessageDiv.textContent = "";
  chatContainer.appendChild(assistantMessageDiv);

  try {
    updateStatus("Generating response...");
    
    // Stream the response
    const chunks = await engine.chat.completions.create({
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 512,
    });

    let fullResponse = "";
    for await (const chunk of chunks) {
      const delta = chunk.choices[0]?.delta.content || "";
      fullResponse += delta;
      assistantMessageDiv.textContent = fullResponse;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Add assistant response to message history
    messages.push({ role: "assistant", content: fullResponse });
    
    updateStatus("Model loaded! Ready to chat.", true);
  } catch (error) {
    console.error("Error generating response:", error);
    assistantMessageDiv.textContent = `Error: ${error.message}`;
    assistantMessageDiv.className = "message system";
    updateStatus("Error occurred. Try again.");
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// Event listeners
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

downloadBtn.addEventListener("click", () => {
  downloadBtn.disabled = true;
  initEngine();
});

deleteCacheBtn.addEventListener("click", async () => {
  if (confirm("Are you sure you want to delete the model cache? This will require re-downloading the model.")) {
    try {
      updateStatus("Clearing cache...");
      // Clear IndexedDB cache used by web-llm
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name && db.name.includes("web-llm")) {
          indexedDB.deleteDatabase(db.name);
        }
      }
      
      // Clear Cache API if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          if (name.includes("web-llm") || name.includes("transformers")) {
            await caches.delete(name);
          }
        }
      }
      
      updateStatus("Cache cleared. Please refresh the page.");
      addSystemMessage("Cache cleared successfully! Please refresh the page to download the model again.");
      
      // Reset state
      engine = null;
      messages = [];
      userInput.disabled = true;
      sendBtn.disabled = true;
      downloadBtn.style.display = "block";
      downloadBtn.disabled = false;
    } catch (error) {
      console.error("Error clearing cache:", error);
      updateStatus("Error clearing cache.");
      addSystemMessage(`Error clearing cache: ${error.message}`);
    }
  }
});

// Don't auto-initialize - wait for user to click download
updateStatus("Please download the model to begin.", false);

// Tab switching logic
const tabs = document.querySelectorAll('menu[role="tablist"] li[role="tab"]');
const tabPanels = document.querySelectorAll('article[role="tabpanel"]');

tabs.forEach((tab, index) => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Update tab states
    tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
    tab.setAttribute('aria-selected', 'true');
    
    // Update panel visibility
    tabPanels.forEach(panel => panel.hidden = true);
    tabPanels[index].hidden = false;
  });
});
