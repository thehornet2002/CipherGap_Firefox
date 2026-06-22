// popup.js

const secretKeyInput = document.getElementById("secretKey");
const saveBtn = document.getElementById("saveBtn");
const exchangeBtn = document.getElementById("exchangeBtn");
const savedKeyEl = document.getElementById("savedKey");
const siteNameEl = document.getElementById("siteName");
const statusEl = document.getElementById("status");
const savedState = document.getElementById("savedState");
const messengerCards = document.querySelectorAll(".messenger-card");

const supportedHosts = [
    "web.rubika.ir",
    "web.splus.ir",
    "web.bale.ai",
    "web.eitaa.com"
];

let currentHostname = null;
let currentChatId = null;
let storageKey = null;
let activeTabId = null;

async function init() {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    activeTabId = tab.id;
    const url = new URL(tab.url);

    currentHostname = url.hostname;
    currentChatId = url.searchParams.get("uid");

    storageKey = currentChatId
        ? `${currentHostname}_${currentChatId}`
        : currentHostname;

    validate_supported_host();
    update_current_chat_ui();
    update_messenger_tabs();
    await load_saved_key();
}

function update_current_chat_ui() {
    siteNameEl.innerText = currentChatId
        ? `${currentHostname} • Chat ${currentChatId}`
        : currentHostname;
}

function update_messenger_tabs() {
    messengerCards.forEach((card) => {
        const messengerName = card
            .querySelector(".messenger-name")
            ?.innerText
            .toLowerCase();

        card.classList.remove("active");

        if (currentHostname.includes("bale") && messengerName === "bale") {
            card.classList.add("active");
        }
        if (currentHostname.includes("rubika") && messengerName === "rubika") {
            card.classList.add("active");
        }
        if (currentHostname.includes("eitaa") && messengerName === "eitaa") {
            card.classList.add("active");
        }
        if (currentHostname.includes("splus") && messengerName === "splus") {
            card.classList.add("active");
        }
    });
}

function validate_supported_host() {
    if (!supportedHosts.includes(currentHostname)) {
        statusEl.innerText = "❌ Unsupported website";
        saveBtn.disabled = true;
        exchangeBtn.disabled = true;
        secretKeyInput.disabled = true;
        saveBtn.style.opacity = ".5";
        exchangeBtn.style.opacity = ".5";
        return false;
    }

    if (!currentChatId) {
        exchangeBtn.disabled = true;
        exchangeBtn.style.opacity = ".5";
    }

    return true;
}

async function load_saved_key() {
    const result = await chrome.storage.local.get([storageKey]);
    const savedKey = result[storageKey];

    if (savedKey) {
        savedState.style.display = "block";
        savedKeyEl.innerText = savedKey;
        secretKeyInput.value = savedKey;
        statusEl.innerText = "🔐 Encryption active";
    } else {
        savedState.style.display = "none";
        statusEl.innerText = "⚠️ No key configured";
    }
}

saveBtn.addEventListener("click", async () => {
    if (!validate_supported_host()) {
        return;
    }

    const key = secretKeyInput.value.trim();
    if (!key) {
        statusEl.innerText = "❌ Please enter a key";
        return;
    }

    await chrome.storage.local.set({ [storageKey]: key });

    savedKeyEl.innerText = key;
    savedState.style.display = "block";
    statusEl.innerText = "✅ Key saved successfully";
});

exchangeBtn.addEventListener("click", async () => {
    if (!validate_supported_host()) {
        return;
    }

    if (!currentChatId) {
        statusEl.innerText = "❌ Open a chat before exchanging keys";
        return;
    }

    const existing = await chrome.storage.local.get([storageKey]);
    if (existing[storageKey]) {
        const replace = confirm(
            "This chat already has an encryption key.\nReplace it with a new exchanged key?"
        );
        if (!replace) {
            return;
        }
    }

    exchangeBtn.disabled = true;
    statusEl.innerText = "⏳ Starting key exchange…";

    try {
        const response = await chrome.tabs.sendMessage(activeTabId, {
            action: "start_key_exchange"
        });

        if (!response?.ok) {
            throw new Error(response?.error ?? "Key exchange failed.");
        }

        statusEl.innerText = "⏳ Waiting for partner to acknowledge…";

        const exchangedKey = await wait_for_exchange_complete(storageKey);

        savedKeyEl.innerText = exchangedKey;
        secretKeyInput.value = exchangedKey;
        savedState.style.display = "block";
        statusEl.innerText = "✅ Key exchanged and saved for this chat";
    } catch (error) {
        console.error("[CipherGap] Exchange failed:", error);
        statusEl.innerText = `❌ ${error.message}`;
    } finally {
        exchangeBtn.disabled = !currentChatId;
    }
});

function wait_for_exchange_complete(key, timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
        const statusKey = `exchange_status_${key}`;
        const startedAt = Date.now();

        const interval = setInterval(async () => {
            const result = await chrome.storage.local.get([key, statusKey]);
            const exchangeStatus = result[statusKey];

            if (result[key] && exchangeStatus?.status === "complete") {
                clearInterval(interval);
                resolve(result[key]);
                return;
            }

            if (Date.now() - startedAt > timeoutMs) {
                clearInterval(interval);
                reject(new Error("Key exchange timed out. Ask your partner to open the chat with CipherGap active."));
            }
        }, 500);
    });
}

init();
