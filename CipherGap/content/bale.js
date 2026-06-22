// bale.js

const BALE_MESSAGE_SCROLLER = "#message_list_scroller_id";
const BALE_CHAT_INPUT = "#editable-message-text";
const BALE_SEND_BUTTON = '[aria-label="send-button"]';

function normalize_message_text(text) {
    return text
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/[\r\n]+/g, "")
        .trim();
}

async function bale_send_message(text) {
    const input = document.querySelector(BALE_CHAT_INPUT);
    if (!input) {
        throw new Error("Bale chat input not found.");
    }

    input.textContent = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));

    const sendButton = document.querySelector(BALE_SEND_BUTTON);
    if (!sendButton) {
        throw new Error("Bale send button not found.");
    }

    sendButton.click();
}

function extract_bale_message_text(messageElement) {
    for (const span of messageElement.querySelectorAll("span")) {
        const text = normalize_message_text(span.textContent ?? "");
        if (text) {
            return text;
        }
    }

    return normalize_message_text(messageElement.textContent ?? "");
}

// =========================
// Encrypt button
// =========================

function inject_encrypt_button_bale() {
    if (document.getElementById("ciphergap-btn")) {
        return;
    }

    const chatFooter = document.getElementById("chat_footer");
    if (!chatFooter) {
        return;
    }

    const footerContainer = chatFooter.querySelector("div");
    if (!footerContainer) {
        return;
    }

    const button = document.createElement("button");
    button.id = "ciphergap-btn";
    button.type = "button";
    button.innerText = "🔐";
    Object.assign(button.style, {
        width: "42px",
        height: "42px",
        border: "none",
        borderRadius: "50%",
        cursor: "pointer",
        marginLeft: "8px",
        fontSize: "18px",
        background: "#2563eb",
        color: "white"
    });

    button.addEventListener("click", async () => {
        try {
            button.disabled = true;

            const input = document.querySelector(BALE_CHAT_INPUT);
            if (!input) {
                return;
            }

            const plainText = input.textContent?.trim();
            if (!plainText) {
                return;
            }

            const secretKey = await get_secret_key();
            if (!secretKey) {
                alert(
                    "No encryption key set for this chat.\n\n" +
                    "Set a key manually in the CipherGap popup, or click " +
                    "\"Exchange Key\" to run Diffie-Hellman key exchange with the other user."
                );
                return;
            }

            const encryptedMessage = await encrypt_message(plainText, secretKey);
            const finalMessage = build_ciphergap_packet(encryptedMessage);

            input.textContent = finalMessage;
            input.dispatchEvent(new Event("input", { bubbles: true }));

            document.querySelector(BALE_SEND_BUTTON)?.click();
        } catch (error) {
            console.error("[CipherGap] Encrypt failed:", error);
            alert("Encryption failed. Check the console for details.");
        } finally {
            button.disabled = false;
        }
    });

    const insertBefore = footerContainer.children[4] ?? null;
    footerContainer.insertBefore(button, insertBefore);
}

// =========================
// Encrypted packet helpers
// =========================

function is_ciphergap_packet(text) {
    return Boolean(text?.trim().startsWith("CGP|"));
}

function find_cgp_span(messageElement) {
    for (const span of messageElement.querySelectorAll("span")) {
        const text = span.textContent ?? "";
        if (text.includes("CGP|")) {
            return span;
        }
    }
    return null;
}

function extract_cgp_packet_text(messageElement) {
    const span = find_cgp_span(messageElement);
    if (!span) {
        return "";
    }

    let text = normalize_message_text(span.textContent ?? "");

    if (text.includes("---")) {
        text = text.split("---")[0].trim();
    }

    return is_ciphergap_packet(text) ? text : "";
}

function replace_message_visual(messageElement, encryptedText, decryptedText) {
    const span = find_cgp_span(messageElement);
    if (!span) {
        return;
    }

    span.textContent = `${encryptedText}\n---\ndecrypted text: ${decryptedText}`;
}

function create_decrypt_button() {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = "Decrypt";
    Object.assign(button.style, {
        display: "block",
        marginTop: "6px",
        padding: "4px 8px",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "11px",
        background: "#16a34a",
        color: "white",
        position: "relative",
        zIndex: "10",
        pointerEvents: "auto"
    });
    return button;
}

function attach_decrypt_button(messageElement, decryptButton) {
    const cgpSpan = find_cgp_span(messageElement);
    const container = cgpSpan?.parentElement ?? messageElement;

    const wrapper = document.createElement("div");
    wrapper.className = "ciphergap-decrypt-wrap";
    wrapper.style.pointerEvents = "auto";
    wrapper.appendChild(decryptButton);
    container.appendChild(wrapper);
}

async function handle_decrypt_click(event, messageElement, decryptButton) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    try {
        decryptButton.disabled = true;

        const currentText = extract_cgp_packet_text(messageElement);
        if (!is_ciphergap_packet(currentText)) {
            alert("Could not read encrypted message from this bubble.");
            return;
        }

        const secretKey = await get_secret_key();
        if (!secretKey) {
            alert(
                "No encryption key set for this chat.\n\n" +
                "Set a key manually or use Exchange Key in the CipherGap popup."
            );
            return;
        }

        const packet = parse_ciphergap_packet(currentText);
        if (!packet?.data) {
            alert("Invalid CipherGap packet format.");
            return;
        }

        const decryptedText = await decrypt_message(packet.data, secretKey);

        replace_message_visual(messageElement, currentText, decryptedText);
        messageElement.dataset.ciphergapDecrypted = "true";

        decryptButton.remove();
    } catch (error) {
        console.error("[CipherGap] Decrypt failed:", error);
        alert("Decryption failed. Wrong key or corrupted message.");
    } finally {
        decryptButton.disabled = false;
    }
}

function process_encrypted_bale_message(messageElement) {
    if (messageElement.dataset.ciphergapProcessed) {
        return;
    }

    const text = extract_cgp_packet_text(messageElement);
    if (!is_ciphergap_packet(text) || messageElement.dataset.ciphergapDecrypted === "true") {
        return;
    }

    const decryptButton = create_decrypt_button();

    decryptButton.addEventListener(
        "click",
        (event) => handle_decrypt_click(event, messageElement, decryptButton),
        true
    );
    decryptButton.addEventListener(
        "mousedown",
        (event) => {
            event.stopPropagation();
            event.stopImmediatePropagation();
        },
        true
    );

    try {
        attach_decrypt_button(messageElement, decryptButton);
        messageElement.dataset.ciphergapProcessed = "true";
    } catch (error) {
        console.error("[CipherGap] Failed to attach decrypt button:", error);
    }
}

function process_bale_message(messageElement) {
    if (!messageElement) {
        return;
    }

    const text = extract_bale_message_text(messageElement);
    if (!text) {
        return;
    }

    if (is_exchange_message(text) && !messageElement.dataset.ciphergapExchangeHandled) {
        messageElement.dataset.ciphergapExchangeHandled = "true";
        handle_incoming_exchange_message(text);
    }

    if (is_ciphergap_packet(text)) {
        process_encrypted_bale_message(messageElement);
    }
}

function scan_bale_messages() {
    const scroller = document.querySelector(BALE_MESSAGE_SCROLLER);
    if (!scroller) {
        return;
    }

    scroller.querySelectorAll("[data-sid]").forEach(process_bale_message);
}

function observe_bale_messages() {
    const interval = setInterval(() => {
        const scroller = document.querySelector(BALE_MESSAGE_SCROLLER);
        if (!scroller) {
            return;
        }

        clearInterval(interval);
        scan_bale_messages();

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof HTMLElement)) {
                        return;
                    }

                    if (node.hasAttribute?.("data-sid")) {
                        process_bale_message(node);
                    }

                    node.querySelectorAll?.("[data-sid]").forEach(process_bale_message);
                });
            }
        });

        observer.observe(scroller, { childList: true, subtree: true });
        console.log("[CipherGap] Bale observer initialized");
    }, 1000);
}

const bale_adapter = {
    hostnames: ["web.bale.ai"],

    is_active() {
        return (
            window.location.hostname === "web.bale.ai" &&
            Boolean(document.querySelector(BALE_CHAT_INPUT))
        );
    },

    is_in_chat() {
        return Boolean(new URL(window.location.href).searchParams.get("uid"));
    },

    get_chat_storage_suffix(url) {
        return url.searchParams.get("uid");
    },

    send_message: bale_send_message,
    extract_message_text: extract_bale_message_text,
    inject_ui: inject_encrypt_button_bale,
    observe_messages: observe_bale_messages
};

register_messenger_adapter("bale", bale_adapter);
observe_bale_messages();
