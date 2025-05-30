// ==== Chat App JavaScript ====
// This script is a unified, working version of your chat logic.
// It combines group chat, emoji picker, message streaks, attachments, and message rendering for a WhatsApp-like chat app.
// Copy this code into your main JavaScript file (e.g., <script> tag or chat-app.js).

document.addEventListener("DOMContentLoaded", () => {
  // ==== DOM Elements ====
  const themeToggle = document.getElementById("theme-toggle");
  const messageInput = document.getElementById("messageInput");
  const timerSelect = document.getElementById("timerSelect");
  const sendBtn = document.getElementById("sendBtn") || document.querySelector(".send-icon");
  const chatWindowContents = document.getElementById("chat-window-contents");
  const streakDisplay = document.getElementById("streakDisplay");
  const emergencyLink = document.getElementById("emergencyAlert");
  const chatHeaderName = document.querySelector("#active-chat-details h3");
  const chatHeaderInfo = document.querySelector("#active-chat-details .info");
  const chatHeaderAvatar = document.querySelector("#chat-window-header .avatar");
  const chatList = document.getElementById("chats-list");
  const searchInput = document.getElementById("search-input");
  const createGroupLink = document.querySelector(".create-group-link");
  const voiceCallBtn = document.getElementById("voiceCallBtn");
  const micIcon = document.getElementById("micIcon");
  const emojiBtn = document.getElementById('emojiBtn');
  const emojiPicker = document.getElementById('emojiPicker');
  const attachBtn = document.getElementById('attachBtn');
  const fileInput = document.getElementById('fileInput');

  // ==== Chat Data ====
  let chatData = {}; // { chatId: { messages: [{sender, type, ...}], streak, lastMessageTime } }
  let currentChatId = null;
  let mediaRecorder, audioChunks = [], isRecording = false;
  const emojiList = ['😀','😂','😍','👍','🎉','😭','😎','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','🤤','😒','😓','😔','😕','🙃','🤑','😲','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩',
];

  // ==== Utility Functions ====
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function saveChatDataToStorage() {
    const dataToStore = {};
    for (let id in chatData) {
      dataToStore[id] = {
        messages: chatData[id].messages,
        streak: chatData[id].streak,
        lastMessageTime: chatData[id].lastMessageTime ? chatData[id].lastMessageTime : null
      };
    }
    localStorage.setItem("chatData", JSON.stringify(dataToStore));
  }

  function loadChatDataFromStorage() {
    const stored = localStorage.getItem("chatData");
    if (stored) {
      const parsed = JSON.parse(stored);
      for (let id in parsed) {
        chatData[id] = {
          messages: parsed[id].messages || [],
          streak: parsed[id].streak || 0,
          lastMessageTime: parsed[id].lastMessageTime || null
        };
      }
    }
  }

  function updateStreakDisplay() {
    if (!currentChatId || !streakDisplay) return;
    const streak = chatData[currentChatId]?.streak || 0;
    streakDisplay.textContent = `🔥 Streak: ${streak} message(s)`;
  }

  // ==== Message Rendering ====
  function renderMessages() {
    if (!currentChatId) return;
    const container = chatWindowContents;
    container.innerHTML = `
      <div class="datestamp-container">
        <span class="datestamp">${new Date().toLocaleDateString()}</span>
      </div>
    `;
    const messages = chatData[currentChatId].messages || [];
    messages.forEach(msg => {
      const el = document.createElement('div');
      el.className = "chat-message-group";
      el.style.margin = '10px 0';
      if (msg.type === 'text') {
        el.innerHTML = `
          <img src="profile.jpg" class="chat-message-avatar">
          <div class="chat-messages">
            <div class="chat-message-container">
              <div class="chat-message chat-message-first">
                <div class="chat-message-sender">${escapeHTML(msg.sender)}</div>
                ${escapeHTML(msg.text)}
                <span class="chat-message-time">${escapeHTML(msg.time)}</span>
              </div>
            </div>
          </div>
        `;
      } else if (msg.type === 'attachment') {
        if (msg.attachmentType === 'image') {
          el.innerHTML = `
            <img src="profile.jpg" class="chat-message-avatar">
            <div class="chat-messages">
              <div class="chat-message-container">
                <div class="chat-message chat-message-first">
                  <div class="chat-message-sender">${escapeHTML(msg.sender)}</div>
                  <img src="${msg.fileUrl}" alt="${escapeHTML(msg.fileName)}"
                       style="max-width: 120px; max-height: 120px; border-radius: 8px;">
                  <br>
                  <small>${escapeHTML(msg.fileName)} · ${escapeHTML(msg.time)}</small>
                </div>
              </div>
            </div>
          `;
        } else {
          el.innerHTML = `
            <img src="profile.jpg" class="chat-message-avatar">
            <div class="chat-messages">
              <div class="chat-message-container">
                <div class="chat-message chat-message-first">
                  <div class="chat-message-sender">${escapeHTML(msg.sender)}</div>
                  <a href="${msg.fileUrl}" download="${escapeHTML(msg.fileName)}">
                    📎 ${escapeHTML(msg.fileName)}
                  </a><br>
                  <small>${escapeHTML(msg.time)}</small>
                </div>
              </div>
            </div>
          `;
        }
      } else if (msg.type === 'audio') {
        el.innerHTML = `
          <img src="profile.jpg" class="chat-message-avatar">
          <div class="chat-messages">
            <div class="chat-message-container">
              <div class="chat-message chat-message-self">
                <audio controls src="${msg.audioUrl}"></audio>
                <span class="chat-message-time">${escapeHTML(msg.time)}</span>
              </div>
            </div>
          </div>
        `;
      }
      container.appendChild(el);
    });
    container.scrollTop = container.scrollHeight;
  }

  // ==== Chat Switching ====
  function switchChat(chatId, title, infoText, avatarSrc) {
    currentChatId = chatId;
    if (!chatData[chatId]) {
      chatData[chatId] = { messages: [], streak: 0, lastMessageTime: null };
    }
    if (chatHeaderName) chatHeaderName.textContent = title;
    if (chatHeaderInfo) chatHeaderInfo.textContent = infoText || 'Online';
    if (chatHeaderAvatar && avatarSrc) chatHeaderAvatar.src = avatarSrc;
    renderMessages();
    updateStreakDisplay();
  }

  // ==== Send Message ====
  function sendMessage() {
    const text = messageInput.value.trim();
    const timer = timerSelect ? parseInt(timerSelect.value, 10) : 0;
    if (!text || !currentChatId) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = { sender: 'You', type: 'text', text, time: timeStr };
    chatData[currentChatId].messages.push(msg);
    renderMessages();
    chatData[currentChatId].streak += 1;
    chatData[currentChatId].lastMessageTime = now;
    updateStreakDisplay();
    saveChatDataToStorage();
    messageInput.value = "";

    if (timer > 0) {
      setTimeout(() => {
        const idx = chatData[currentChatId].messages.indexOf(msg);
        if (idx !== -1) {
          chatData[currentChatId].messages.splice(idx, 1);
          renderMessages();
          saveChatDataToStorage();
        }
      }, timer * 1000);
    }
  }

  // ==== Attachments ====
  attachBtn?.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file || !currentChatId) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileDataUrl = e.target.result;
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const msg = {
        sender: 'You',
        type: 'attachment',
        attachmentType: file.type.startsWith('image/') ? 'image' : 'file',
        fileName: file.name,
        fileUrl: fileDataUrl,
        time: timeStr
      };
      chatData[currentChatId].messages.push(msg);
      renderMessages();
      chatData[currentChatId].streak += 1;
      chatData[currentChatId].lastMessageTime = now;
      updateStreakDisplay();
      saveChatDataToStorage();
    };
    reader.readAsDataURL(file);
  });

  // ==== Emoji Picker ====
  emojiBtn?.addEventListener('click', function() {
    emojiPicker.innerHTML = '';
    emojiList.forEach(emoji => {
      const span = document.createElement('span');
      span.textContent = emoji;
      span.className = 'emoji';
      span.style.fontSize = '22px';
      span.style.cursor = 'pointer';
      span.style.padding = '5px';
      span.onclick = function() {
        const start = messageInput.selectionStart, end = messageInput.selectionEnd;
        const value = messageInput.value;
        messageInput.value = value.slice(0, start) + emoji + value.slice(end);
        messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
        emojiPicker.style.display = 'none';
        messageInput.focus();
      };
      emojiPicker.appendChild(span);
    });
    emojiPicker.style.display = (emojiPicker.style.display === 'block') ? 'none' : 'block';
  });
  document.addEventListener('mousedown', function(e) {
    if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
      emojiPicker.style.display = 'none';
    }
  });

  // ==== Voice Recording ====
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const msg = { sender: 'You', type: 'audio', audioUrl, time: timeStr };
        chatData[currentChatId].messages.push(msg);
        renderMessages();
        chatData[currentChatId].streak += 1;
        chatData[currentChatId].lastMessageTime = now;
        updateStreakDisplay();
        saveChatDataToStorage();
        

      };
      mediaRecorder.start();
      micIcon.classList.add("recording");
      isRecording = true;
    } catch (err) {
      alert("Microphone access denied. Please allow microphone access.");
    }
  }
  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      micIcon.classList.remove("recording");
      isRecording = false;
    }
  }

  // ==== Setup Event Listeners ====
  function chatTiles() {
    return document.querySelectorAll(".chat-tile");
  }
  function setupEventListeners() {
    chatTiles().forEach(tile => {
      tile.addEventListener("click", () => {
        const title = tile.querySelector(".chat-tile-title span")?.textContent || "Unknown";
        const avatar = tile.querySelector(".chat-tile-avatar")?.src || "";
        const chatId = title.toLowerCase().replace(/\s+/g, "-");
        switchChat(chatId, title, "Online", avatar);
      });
    });
    themeToggle?.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      document.body.classList.toggle("light-mode");
    });
    sendBtn?.addEventListener("click", sendMessage);
    messageInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
    searchInput?.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase().trim();
      chatTiles().forEach(tile => {
        const name = tile.querySelector(".chat-tile-title span").textContent.toLowerCase();
        const msg = tile.querySelector(".chat-tile-subtitle span").textContent.toLowerCase();
        tile.style.display = name.includes(query) || msg.includes(query) ? "flex" : "none";
      });
    });
  
    createGroupLink?.addEventListener("click", () => {
      const name = prompt("Enter group name:");
      if (name) {
        const tile = document.createElement("div");
        tile.className = "chat-tile";
        const chatId = name.toLowerCase().replace(/\s+/g, "-");
        tile.innerHTML = `
          <img src="https://picsum.photos/seed/${Math.random()}/50" class="chat-tile-avatar">
          <div class="chat-tile-details">
            <div class="chat-tile-title"><span>${name}</span><span>Now</span></div>
            <div class="chat-tile-subtitle">
              <span>You created a group</span>
              <span class="chat-tile-menu"><img src="pin.svg" class="pin"></span>
            </div>
          </div>`;
        chatList.prepend(tile);
        setupEventListeners(); // rebind to new tiles
        tile.click(); // open new group
      }
    });
    voiceCallBtn?.addEventListener("click", () => {
      window.location.href = "call.html";
    });
    micIcon?.addEventListener("click", () => {
      isRecording ? stopRecording() : startRecording();
    });
  }

  // ==== Initialization ====
  loadChatDataFromStorage();
  setupEventListeners();
  if (chatTiles().length > 0) chatTiles()[0].click();
});

// Place this after the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const voiceCallBtn = document.getElementById("voiceCallBtn");
  if (voiceCallBtn) {
    voiceCallBtn.addEventListener("click", () => {
      // Replace "call.html" with your target page if different
      window.location.href = "call.html";
    });
  }
});voiceCallBtn?.addEventListener("click", () => {
  window.location.href = "call.html";
});

document.addEventListener("DOMContentLoaded", () => {
  const voiceCallBtn = document.getElementById("videoCallBtn");
  if (voiceCallBtn) {
    voiceCallBtn.addEventListener("click", () => {
      // Replace "call.html" with your target page if different
      window.location.href = "video.html";
    });
  }
});voiceCallBtn?.addEventListener("click", () => {
  window.location.href = "video.html";
});

function updateChatListPreview(chatId, previewText) {
  const chatListItems = document.querySelectorAll('#chat-list li');
  chatListItems.forEach(li => {
    const id = li.dataset.id;
    if (id && id.toLowerCase() === chatId.toLowerCase()) {
      li.textContent = `${id}: ${previewText}`;
    }
  });
}


const searchIcon = document.getElementById('search-icon');
const searchBox = document.getElementById('search-box');

// Show search box on touch or click of the icon
function showSearchBox() {
  searchBox.style.display = 'inline-block';
  searchBox.focus();
  searchIcon.classList.add('highlighted');
}

// Hide when search box loses focus
function hideSearchBox() {
  searchBox.style.display = 'none';
  searchIcon.classList.remove('highlighted');
}

searchIcon.addEventListener('click', showSearchBox);
searchIcon.addEventListener('touchstart', function(e) {
  e.preventDefault(); // Prevents double trigger on touch devices
  showSearchBox();
});
searchBox.addEventListener('blur', hideSearchBox);
searchBox.addEventListener('focus', () => searchIcon.classList.add('highlighted'));

document.addEventListener("DOMContentLoaded", () => {
  const calendarIcon = document.getElementById('calendarIcon');
  const messageInput = document.getElementById('messageInput');

  // Ensure the following elements exist in your HTML for this JS to work:
  const overlay = document.getElementById('overlay');
  const popup = document.getElementById('popup');
  const popupTitle = document.getElementById('popupTitle');
  const popupDate = document.getElementById('popupDate');
  const popupTime = document.getElementById('popupTime');
  const popupSet = document.getElementById('popupSet');
  const popupCancel = document.getElementById('popupCancel');

  const alertOverlay = document.getElementById('alertOverlay');
  const alertModal = document.getElementById('alertModal');
  const alertMessage = document.getElementById('alertMessage');
  const alertOk = document.getElementById('alertOk');

  let meetingTimeout = null;

  function openPopup() {
    overlay.style.display = 'block';
    popup.style.display = 'block';
  }

  function closePopup() {
    overlay.style.display = 'none';
    popup.style.display = 'none';
  }

  function showAlert(message) {
    alertMessage.textContent = message;
    alertOverlay.style.display = 'block';
    alertModal.style.display = 'block';
  }

  function hideAlert() {
    alertOverlay.style.display = 'none';
    alertModal.style.display = 'none';
  }

  calendarIcon.addEventListener("click", () => {
    popupTitle.value = '';
    popupDate.value = '';
    popupTime.value = '';
    openPopup();
  });

  popupCancel.addEventListener("click", closePopup);
  overlay.addEventListener("click", closePopup);
  alertOk.addEventListener("click", hideAlert);
  alertOverlay.addEventListener("click", hideAlert);

  popupSet.addEventListener("click", () => {
    const title = popupTitle.value.trim();
    const date = popupDate.value;
    const time = popupTime.value;

    if (!title || !date || !time) {
      showAlert("Please fill all fields: title, date, and time!");
      return;
    }

    const msg = `📅 Meeting: ${title} | Date: ${date} | Time: ${time}`;
    messageInput.value = msg;

    const [year, month, day] = date.split("-");
    const [hour, minute] = time.split(":");
    const meetingDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    const diff = meetingDate - now;

    if (diff > 0) {
      if (meetingTimeout) clearTimeout(meetingTimeout);
      meetingTimeout = setTimeout(() => {
        showAlert(`🔔 It's time for your meeting: ${title}`);
      }, diff);
      showAlert(`✅ Meeting scheduled! Alert set for ${date} at ${time}.`);
    } else {
      showAlert("❌ Meeting time is in the past. Please select a future time.");
    }

    closePopup();
  });
});
var button = document.getElementById("theme-toggle");
var iconImg = button.querySelector("img");

button.onclick = function () {
    document.body.classList.toggle("dark-theme");

    if (document.body.classList.contains("dark-theme")) {
        iconImg.src = "sun.png"; 
    } else {
        iconImg.src = "moon.png"; 
    }
};
