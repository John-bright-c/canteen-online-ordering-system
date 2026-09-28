// CanteenBite AI Assistant - frontend
// Sends the question to Flask with fetch() and shows the answer. No libraries needed.
// No API key is here: the key lives only on the server (.env file).

(function () {
  const toggleBtn = document.getElementById("chatbot-toggle");
  const windowEl = document.getElementById("chatbot-window");
  const closeBtn = document.getElementById("chatbot-close");
  const messagesEl = document.getElementById("chatbot-messages");
  const inputEl = document.getElementById("chatbot-input");
  const sendBtn = document.getElementById("chatbot-send");
  const modeEl = document.getElementById("chatbot-mode");
  const suggestionsEl = document.getElementById("chatbot-suggestions");

  if (!toggleBtn || !windowEl) return; // widget not on this page

  const WELCOME =
    "Hi! I'm the CanteenBite assistant. Ask me about the menu, prices, " +
    "recommendations, how to order, tokens or your order status.";

  let history = [];       // last few messages, so follow-up questions work
  let isBusy = false;     // true while waiting for the server
  let started = false;    // welcome message + mode are loaded on first open

  // ---------- Open / close ----------
  function openChat() {
    windowEl.classList.add("open");
    windowEl.setAttribute("aria-hidden", "false");
    toggleBtn.setAttribute("aria-expanded", "true");
    if (!started) {
      started = true;
      addMessage("assistant", WELCOME);
      loadMode();
    }
    inputEl.focus();
  }

  function closeChat() {
    windowEl.classList.remove("open");
    windowEl.setAttribute("aria-hidden", "true");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.focus();
  }

  toggleBtn.addEventListener("click", function () {
    windowEl.classList.contains("open") ? closeChat() : openChat();
  });
  closeBtn.addEventListener("click", closeChat);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && windowEl.classList.contains("open")) closeChat();
  });

  // ---------- Show which mode is active (AI or basic) ----------
  function showMode(isAi) {
    modeEl.className = "chatbot-mode " + (isAi ? "ai" : "basic");
    modeEl.textContent = isAi ? "AI-powered" : "Basic mode (rule-based, not AI)";
  }

  function loadMode() {
    fetch("/chatbot/status")
      .then(function (r) { return r.json(); })
      .then(function (data) { showMode(Boolean(data.ai_enabled)); })
      .catch(function () { modeEl.textContent = ""; });
  }

  // ---------- Chat bubbles ----------
  // textContent (not innerHTML) so nobody can inject HTML into the page.
  function addMessage(role, text, options) {
    options = options || {};
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble " + role + (options.isError ? " error" : "");
    bubble.textContent = text;

    if (options.tag) {
      const tag = document.createElement("span");
      tag.className = "chat-tag";
      tag.textContent = options.tag;
      bubble.appendChild(tag);
    }
    messagesEl.appendChild(bubble);
    scrollToBottom();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  let typingEl = null;
  function showTyping() {
    typingEl = document.createElement("div");
    typingEl.className = "chat-typing";
    typingEl.innerHTML = "<span></span><span></span><span></span>"; // fixed markup, no user data
    messagesEl.appendChild(typingEl);
    scrollToBottom();
  }
  function hideTyping() {
    if (typingEl) { typingEl.remove(); typingEl = null; }
  }

  function setBusy(busy) {
    isBusy = busy;
    sendBtn.disabled = busy;
  }

  // ---------- Send a message ----------
  async function sendMessage(text) {
    text = text.trim();
    if (!text || isBusy) return;

    suggestionsEl.classList.add("hidden");
    addMessage("user", text);
    inputEl.value = "";
    setBusy(true);
    showTyping();

    try {
      const response = await fetch("/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history }),
      });

      let data = {};
      try { data = await response.json(); } catch (e) { /* server sent no JSON */ }

      hideTyping();

      if (!response.ok) {
        const msg = response.status === 401
          ? "Your session has expired. Please log in again."
          : (data.error || "Something went wrong. Please try again.");
        addMessage("assistant", msg, { isError: true });
        return;
      }

      showMode(data.mode === "ai");
      addMessage("assistant", data.reply, {
        tag: data.mode === "basic" ? (data.notice || "Basic mode - rule-based answer, not AI") : "",
      });

      history.push({ role: "user", content: text });
      history.push({ role: "assistant", content: data.reply });
      history = history.slice(-6);
    } catch (error) {
      hideTyping();
      addMessage("assistant", "I couldn't connect to the server. Please check your connection and try again.", { isError: true });
    } finally {
      setBusy(false);
      inputEl.focus();
    }
  }

  sendBtn.addEventListener("click", function () { sendMessage(inputEl.value); });
  inputEl.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage(inputEl.value);
    }
  });
  suggestionsEl.querySelectorAll("button").forEach(function (btn) {
    btn.addEventListener("click", function () { sendMessage(btn.textContent); });
  });
})();