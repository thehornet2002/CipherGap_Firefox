// popup.js

const secretKeyInput =
    document.getElementById(
        "secretKey"
    );

const saveBtn =
    document.getElementById(
        "saveBtn"
    );

const savedKeyEl =
    document.getElementById(
        "savedKey"
    );

const siteNameEl =
    document.getElementById(
        "siteName"
    );

const statusEl =
    document.getElementById(
        "status"
    );

const savedState =
    document.getElementById(
        "savedState"
    );

const messengerCards =
    document.querySelectorAll(
        ".messenger-card"
    );


const supportedHosts = [
    "web.rubika.ir",
    "web.splus.ir",
    "web.bale.ai",
    "web.eitaa.com"
];


let currentHostname = null;

let currentChatId = null;

let storageKey = null;



/**
 * Init popup
 */
async function init() {

    const [tab] =
        await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

    const url =
        new URL(tab.url);

    currentHostname =
        url.hostname;

    currentChatId =
        url.searchParams.get(
            "uid"
        );

    storageKey =
        currentChatId
            ? `${currentHostname}_${currentChatId}`
            : currentHostname;

    validate_supported_host();
    update_current_chat_ui();
    update_messenger_tabs();
    load_saved_key();
}



/**
 * Update current chat label
 */
function update_current_chat_ui() {

    siteNameEl.innerText =
        currentChatId
            ? `${currentHostname} • Chat ${currentChatId}`
            : currentHostname;
}



/**
 * Highlight active messenger
 */
function update_messenger_tabs() {

    messengerCards.forEach(
        (card) => {

            const messengerName =
                card
                    .querySelector(
                        ".messenger-name"
                    )
                    ?.innerText
                    .toLowerCase();

            card.classList.remove(
                "active"
            );

            if (
                currentHostname.includes(
                    "bale"
                ) &&
                messengerName === "bale"
            ) {

                card.classList.add(
                    "active"
                );
            }

            if (
                currentHostname.includes(
                    "rubika"
                ) &&
                messengerName === "rubika"
            ) {

                card.classList.add(
                    "active"
                );
            }

            if (
                currentHostname.includes(
                    "eitaa"
                ) &&
                messengerName === "eitaa"
            ) {

                card.classList.add(
                    "active"
                );
            }

            if (
                currentHostname.includes(
                    "splus"
                ) &&
                messengerName === "splus"
            ) {

                card.classList.add(
                    "active"
                );
            }
        }
    );
}



/**
 * Validate supported website
 */
function validate_supported_host() {

    if (
        !supportedHosts.includes(
            currentHostname
        )
    ) {

        statusEl.innerText =
            "❌ Unsupported website";

        saveBtn.disabled =
            true;

        secretKeyInput.disabled =
            true;

        saveBtn.style.opacity =
            ".5";

        return false;
    }

    return true;
}



/**
 * Load saved key
 */
async function load_saved_key() {

    const result =
        await chrome.storage.local.get(
            [storageKey]
        );

    const savedKey =
        result[storageKey];

    if (savedKey) {

        savedState.style.display =
            "block";

        savedKeyEl.innerText =
            savedKey;

        secretKeyInput.value =
            savedKey;

        statusEl.innerText =
            "🔐 Encryption active";

    } else {

        savedState.style.display =
            "none";

        statusEl.innerText =
            "⚠️ No key configured";
    }
}



/**
 * Save key
 */
saveBtn.addEventListener(
    "click",
    async () => {

        if (
            !validate_supported_host()
        ) {
            return;
        }

        const key =
            secretKeyInput.value
                .trim();

        if (!key) {

            statusEl.innerText =
                "❌ Please enter a key";

            return;
        }

        await chrome.storage.local.set({
            [storageKey]: key
        });

        savedKeyEl.innerText =
            key;

        savedState.style.display =
            "block";

        statusEl.innerText =
            "✅ Key saved successfully";
    }
);


init();
