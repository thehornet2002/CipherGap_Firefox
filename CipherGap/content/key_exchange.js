// key_exchange.js — Diffie-Hellman key exchange protocol (messenger-agnostic)

const EXCHANGE_START_PREFIX = "start exchange key:";
const EXCHANGE_ACK_PREFIX = "start exchange ack:";
const EXCHANGE_TIMEOUT_MS = 5 * 60 * 1000;

const pending_exchanges = new Map();
const handled_exchange_nonces = new Set();

function build_start_exchange_message(nonce, publicKeyB64) {
    return `${EXCHANGE_START_PREFIX} ${nonce}|${publicKeyB64}`;
}

function build_ack_exchange_message(nonce, publicKeyB64) {
    return `${EXCHANGE_ACK_PREFIX} ${nonce}|${publicKeyB64}`;
}

function is_exchange_message(text) {
    if (!text) {
        return false;
    }
    const normalized = normalize_exchange_text(text);
    return (
        /^start exchange key:/i.test(normalized) ||
        /^start exchange ack:/i.test(normalized)
    );
}

function normalize_exchange_text(text) {
    return text
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/[\r\n]+/g, " ")
        .trim();
}

function parse_exchange_message(text) {
    const normalized = normalize_exchange_text(text);

    if (/^start exchange key:/i.test(normalized)) {
        const body = normalized.replace(/^start exchange key:\s*/i, "");
        const pipeIndex = body.indexOf("|");
        if (pipeIndex === -1) {
            return null;
        }
        return {
            type: "start",
            nonce: body.slice(0, pipeIndex).trim(),
            publicKeyB64: body.slice(pipeIndex + 1).trim()
        };
    }

    if (/^start exchange ack:/i.test(normalized)) {
        const body = normalized.replace(/^start exchange ack:\s*/i, "");
        const pipeIndex = body.indexOf("|");
        if (pipeIndex === -1) {
            return null;
        }
        return {
            type: "ack",
            nonce: body.slice(0, pipeIndex).trim(),
            publicKeyB64: body.slice(pipeIndex + 1).trim()
        };
    }

    return null;
}

function get_pending_key(storageKey, nonce) {
    return pending_exchanges.get(`${storageKey}:${nonce}`);
}

function set_pending_exchange(storageKey, nonce, data) {
    const key = `${storageKey}:${nonce}`;
    pending_exchanges.set(key, { ...data, storageKey, nonce, createdAt: Date.now() });

    setTimeout(() => {
        pending_exchanges.delete(key);
    }, EXCHANGE_TIMEOUT_MS);
}

function mark_exchange_handled(storageKey, nonce, type) {
    handled_exchange_nonces.add(`${storageKey}:${nonce}:${type}`);
}

function is_exchange_handled(storageKey, nonce, type) {
    return handled_exchange_nonces.has(`${storageKey}:${nonce}:${type}`);
}

async function finalize_exchange(storageKey, privateKey, peerPublicKeyB64) {
    const sharedSecret = await derive_shared_secret_string(privateKey, peerPublicKeyB64);
    await set_secret_key(sharedSecret);

    await chrome.storage.local.set({
        [`exchange_status_${storageKey}`]: {
            status: "complete",
            at: Date.now()
        }
    });

    console.log("[CipherGap] Key exchange complete for", storageKey);
    return sharedSecret;
}

async function handle_incoming_start(parsed, storageKey) {
    if (is_exchange_handled(storageKey, parsed.nonce, "start")) {
        return;
    }

    const existingPending = get_pending_key(storageKey, parsed.nonce);
    if (existingPending?.role === "initiator") {
        return;
    }

    mark_exchange_handled(storageKey, parsed.nonce, "start");

    const adapter = get_active_messenger_adapter();
    if (!adapter) {
        return;
    }

    const session = await create_dh_session();
    set_pending_exchange(storageKey, parsed.nonce, {
        privateKey: session.privateKey,
        role: "responder",
        peerPublicKeyB64: parsed.publicKeyB64
    });

    const ackMessage = build_ack_exchange_message(parsed.nonce, session.publicKeyB64);
    await adapter.send_message(ackMessage);

    await finalize_exchange(storageKey, session.privateKey, parsed.publicKeyB64);
    pending_exchanges.delete(`${storageKey}:${parsed.nonce}`);
}

async function handle_incoming_ack(parsed, storageKey) {
    if (is_exchange_handled(storageKey, parsed.nonce, "ack")) {
        return;
    }

    const pending = get_pending_key(storageKey, parsed.nonce);
    if (!pending || pending.role !== "initiator") {
        return;
    }

    mark_exchange_handled(storageKey, parsed.nonce, "ack");

    await finalize_exchange(storageKey, pending.privateKey, parsed.publicKeyB64);
    pending_exchanges.delete(`${storageKey}:${parsed.nonce}`);
}

async function handle_incoming_exchange_message(text) {
    const parsed = parse_exchange_message(text);
    if (!parsed) {
        return;
    }

    const storageKey = get_storage_key();

    if (parsed.type === "start") {
        await handle_incoming_start(parsed, storageKey);
    } else if (parsed.type === "ack") {
        await handle_incoming_ack(parsed, storageKey);
    }
}

async function start_key_exchange() {
    const adapter = get_active_messenger_adapter();
    if (!adapter) {
        throw new Error("No supported messenger detected on this page.");
    }

    if (!adapter.is_in_chat?.()) {
        throw new Error("Open a chat first before exchanging keys.");
    }

    const storageKey = get_storage_key();
    const session = await create_dh_session();

    set_pending_exchange(storageKey, session.nonce, {
        privateKey: session.privateKey,
        role: "initiator"
    });

    await chrome.storage.local.set({
        [`exchange_status_${storageKey}`]: {
            status: "waiting",
            nonce: session.nonce,
            at: Date.now()
        }
    });

    const startMessage = build_start_exchange_message(session.nonce, session.publicKeyB64);
    await adapter.send_message(startMessage);

    return { nonce: session.nonce, storageKey };
}

function init_key_exchange_listener() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === "start_key_exchange") {
            start_key_exchange()
                .then((result) => sendResponse({ ok: true, ...result }))
                .catch((error) => sendResponse({ ok: false, error: error.message }));
            return true;
        }

        if (message.action === "get_chat_context") {
            const adapter = get_active_messenger_adapter();
            sendResponse({
                ok: true,
                inChat: adapter?.is_in_chat?.() ?? false,
                storageKey: get_storage_key(),
                messenger: adapter?.name ?? null
            });
            return false;
        }
    });
}

init_key_exchange_listener();
