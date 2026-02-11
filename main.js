import { CreateMLCEngine, deleteModelAllInfoInCache } from "@mlc-ai/web-llm";

// Model configurations
const MODEL_CONFIGS = {
  qwen: {
    name: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    chatContainer: document.getElementById("chat-container"),
    userInput: document.getElementById("user-input"),
    sendBtn: document.getElementById("send-btn"),
    progressContainer: document.getElementById("progress-container"),
    progressBar: document.getElementById("progress-bar"),
    statsBar: document.getElementById("qwen-stats-bar"),
    tokensPerSecElement: document.getElementById("qwen-tokens-per-sec"),
    tokenCountElement: document.getElementById("qwen-token-count"),
    engine: null,
    messages: []
  },
  llama: {
    name: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    chatContainer: document.getElementById("llama-chat-container"),
    userInput: document.getElementById("llama-user-input"),
    sendBtn: document.getElementById("llama-send-btn"),
    progressContainer: document.getElementById("llama-progress-container"),
    progressBar: document.getElementById("llama-progress-bar"),
    statsBar: document.getElementById("llama-stats-bar"),
    tokensPerSecElement: document.getElementById("llama-tokens-per-sec"),
    tokenCountElement: document.getElementById("llama-token-count"),
    engine: null,
    messages: []
  },
  smolm: {
    name: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
    chatContainer: document.getElementById("smolm-chat-container"),
    userInput: document.getElementById("smolm-user-input"),
    sendBtn: document.getElementById("smolm-send-btn"),
    progressContainer: document.getElementById("smolm-progress-container"),
    progressBar: document.getElementById("smolm-progress-bar"),
    statsBar: document.getElementById("smolm-stats-bar"),
    tokensPerSecElement: document.getElementById("smolm-tokens-per-sec"),
    tokenCountElement: document.getElementById("smolm-token-count"),
    engine: null,
    messages: []
  }
};

// Global DOM elements
const statusText = document.getElementById("status-text");
const downloadBtn = document.getElementById("download-btn");
const deleteCacheBtn = document.getElementById("delete-cache-btn");

// Current active model key
let currentModelKey = "llama";

// Initialize the engine for a specific model
async function initEngine(modelKey) {
  const config = MODEL_CONFIGS[modelKey];
  if (!config) {
    console.error("Invalid model key:", modelKey);
    return;
  }

  updateStatus(`Loading ${modelKey} model... This may take a minute on first run.`);
  config.progressContainer.style.display = "block";
  
  try {
    config.engine = await CreateMLCEngine(config.name, {
      initProgressCallback: (progress) => {
        const percent = Math.round(progress.progress * 100);
        updateStatus(`Loading ${modelKey} model: ${percent}% - ${progress.text}. Don't worry if it's stuck.`);
        updateProgressBar(config.progressBar, percent);
      },
    });
    
    updateStatus(`${modelKey} model loaded! Ready to chat.`, true);
    config.progressContainer.style.display = "none";
    enableInput(config);
    
    // Hide download button only for current model
    if (modelKey === currentModelKey) {
      downloadBtn.style.display = "none";
    }
    
    addSystemMessage(config.chatContainer, `${modelKey} model loaded successfully! You can now start chatting.`);
  } catch (error) {
    console.error("Failed to initialize engine:", error);
    updateStatus("Failed to load model. Check console for details.");
    config.progressContainer.style.display = "none";
    addSystemMessage(config.chatContainer, `Error: ${error.message}. Make sure WebGPU is supported in your browser.`);
  }
}

// Helper to delete an IndexedDB database and wait for completion
function deleteIndexedDBAsync(name) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => { console.log('Deleted indexedDB', name); resolve(); };
      req.onblocked = () => { console.warn('Delete blocked for indexedDB', name); resolve(); };
      req.onerror = (e) => { console.warn('Error deleting indexedDB', name, e); resolve(); };
    } catch (e) {
      console.warn('deleteIndexedDBAsync exception', name, e);
      resolve();
    }
  });
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
function updateProgressBar(progressBarElement, percent) {
  progressBarElement.value = percent;
}

// Enable input after model loads
function enableInput(config) {
  config.userInput.disabled = false;
  config.sendBtn.disabled = false;
  config.userInput.focus();
}

// Add message to chat
function addMessage(chatContainer, role, content) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = content;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return messageDiv;
}

// Add system message
function addSystemMessage(chatContainer, content) {
  addMessage(chatContainer, "system", content);
}

// Send message and get response
async function sendMessage(modelKey) {
  const config = MODEL_CONFIGS[modelKey];
  const userMessage = config.userInput.value.trim();
  if (!userMessage || !config.engine) return;

  // Add user message to chat
  addMessage(config.chatContainer, "user", userMessage);
  config.messages.push({ role: "user", content: userMessage });
  
  // Clear input
  config.userInput.value = "";
  config.userInput.disabled = true;
  config.sendBtn.disabled = true;

  // Create assistant message placeholder
  const assistantMessageDiv = document.createElement("div");
  assistantMessageDiv.className = "message assistant";
  assistantMessageDiv.textContent = "";
  config.chatContainer.appendChild(assistantMessageDiv);

  // Show stats bar
  config.statsBar.classList.add("visible");

  try {
    updateStatus("Generating response...");
    
    // Stream the response
    const chunks = await config.engine.chat.completions.create({
      messages: config.messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 512,
    });

    let fullResponse = "";
    let tokenCount = 0;
    let startTime = Date.now();
    let lastUpdateTime = startTime;
    
    for await (const chunk of chunks) {
      const delta = chunk.choices[0]?.delta.content || "";
      fullResponse += delta;
      assistantMessageDiv.textContent = fullResponse;
      config.chatContainer.scrollTop = config.chatContainer.scrollHeight;
      
      // Count tokens (approximate - each character/word as a token)
      if (delta) {
        tokenCount++;
        
        // Update stats every 100ms for smooth updates
        const now = Date.now();
        if (now - lastUpdateTime > 100) {
          const elapsedSeconds = (now - startTime) / 1000;
          const tokensPerSecond = elapsedSeconds > 0 ? (tokenCount / elapsedSeconds).toFixed(1) : 0;
          
          config.tokensPerSecElement.textContent = `${tokensPerSecond} tok/s`;
          config.tokenCountElement.textContent = tokenCount;
          
          lastUpdateTime = now;
        }
      }
    }

    // Final update
    const totalElapsedSeconds = (Date.now() - startTime) / 1000;
    const finalTokensPerSecond = totalElapsedSeconds > 0 ? (tokenCount / totalElapsedSeconds).toFixed(1) : 0;
    config.tokensPerSecElement.textContent = `${finalTokensPerSecond} tok/s`;
    config.tokenCountElement.textContent = tokenCount;

    // Add assistant response to message history
    config.messages.push({ role: "assistant", content: fullResponse });
    
    updateStatus(`${modelKey} model loaded! Ready to chat.`, true);
  } catch (error) {
    console.error("Error generating response:", error);
    assistantMessageDiv.textContent = `Error: ${error.message}`;
    assistantMessageDiv.className = "message system";
    updateStatus("Error occurred. Try again.");
    
    // Hide stats bar on error
    config.statsBar.classList.remove("visible");
  } finally {
    config.userInput.disabled = false;
    config.sendBtn.disabled = false;
    config.userInput.focus();
  }
}

// Event listeners for each model
Object.keys(MODEL_CONFIGS).forEach(modelKey => {
  const config = MODEL_CONFIGS[modelKey];
  
  config.sendBtn.addEventListener("click", () => sendMessage(modelKey));
  config.userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(modelKey);
    }
  });
});

downloadBtn.addEventListener("click", () => {
  downloadBtn.disabled = true;
  initEngine(currentModelKey);
});

deleteCacheBtn.addEventListener("click", async () => {
  if (confirm("Are you sure you want to delete the model cache? This will require re-downloading the model.")) {
    try {
      updateStatus("Clearing cache...");

      // Use the library helper to remove all model-related info for each model
      for (const modelKey of Object.keys(MODEL_CONFIGS)) {
        const config = MODEL_CONFIGS[modelKey];
        try {
          await deleteModelAllInfoInCache(config.name);
          console.log("deleteModelAllInfoInCache succeeded for", config.name);
        } catch (err) {
          console.warn("deleteModelAllInfoInCache failed or not supported:", err);
        }
      }

      // Clear IndexedDB databases that look like model caches
      if (indexedDB && indexedDB.databases) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (!db.name) continue;
          const name = db.name.toLowerCase();
          if (name.includes("web-llm") || name.includes("mlc") || name.includes("tvmjs")) {
            try { await deleteIndexedDBAsync(db.name); } catch (e) { console.warn("Failed to delete indexeddb", db.name, e); }
          }
        }
      }

      // Clear Cache API entries that look like model caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          const n = name.toLowerCase();
          if (n.includes("web-llm") || n.includes("transformers") || n.includes("tvmjs") || n.includes("mlc") || n.includes("tensor-cache")) {
            try { await caches.delete(name); } catch (e) { console.warn("Failed to delete cache", name, e); }
          }
        }
      }

      // Unregister service workers that might hold model caches
      if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            try {
              await reg.unregister();
              console.log('Unregistered service worker', reg);
            } catch (e) { console.warn('Failed to unregister service worker', e); }
          }
        } catch (e) { console.warn('Error while checking service workers', e); }
      }
      
      updateStatus("Cache cleared. Please refresh the page.");
      
      // Add system message to all chat containers
      for (const modelKey of Object.keys(MODEL_CONFIGS)) {
        const config = MODEL_CONFIGS[modelKey];
        addSystemMessage(config.chatContainer, "Cache cleared successfully! Please refresh the page to download the model again.");
      }
      
      // Reset state for all models
      for (const modelKey of Object.keys(MODEL_CONFIGS)) {
        const config = MODEL_CONFIGS[modelKey];
        config.engine = null;
        config.messages = [];
        config.userInput.disabled = true;
        config.sendBtn.disabled = true;
      }
      
      downloadBtn.style.display = "block";
      downloadBtn.disabled = false;
    } catch (error) {
      console.error("Error clearing cache:", error);
      updateStatus("Error clearing cache.");
      addSystemMessage(MODEL_CONFIGS[currentModelKey].chatContainer, `Error clearing cache: ${error.message}`);
    }
  }
});

// Don't auto-initialize - wait for user to click download
updateStatus("Please download the llama model to begin.", false);

// Tab switching logic
const tabs = document.querySelectorAll('menu[role="tablist"] button[role="tab"]');
const tabPanels = document.querySelectorAll('article[role="tabpanel"]');

// Map tab indices to model keys
const tabToModelKey = {
  0: "llama",
  1: "qwen",
  2: null,     // arcee - placeholder
  3: "smolm"
};

tabs.forEach((tab, index) => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Update tab states
    tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
    tab.setAttribute('aria-selected', 'true');
    
    // Update panel visibility
    tabPanels.forEach(panel => panel.hidden = true);
    tabPanels[index].hidden = false;
    
    // Update current model key
    const modelKey = tabToModelKey[index];
    if (modelKey) {
      currentModelKey = modelKey;
      const config = MODEL_CONFIGS[modelKey];
      
      // Update download button visibility
      if (config.engine) {
        downloadBtn.style.display = "none";
        updateStatus(`${modelKey} model loaded! Ready to chat.`, true);
      } else {
        downloadBtn.style.display = "block";
        downloadBtn.disabled = false;
        updateStatus(`Please download the ${modelKey} model to begin.`, false);
      }
    } else {
      // Placeholder tab (arcee)
      downloadBtn.style.display = "none";
      updateStatus("This model is not yet available.", false);
    }
  });
});
