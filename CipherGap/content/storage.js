
// storage.js

function get_storage_key() {
    const url = new URL(window.location.href);
    const hostname = url.hostname;
    const adapter = get_messenger_adapter_by_hostname(hostname);

    if (adapter?.get_chat_storage_suffix) {
        const suffix = adapter.get_chat_storage_suffix(url);
        if (suffix) {
            return `${hostname}_${suffix}`;
        }
    }

    if (hostname === "web.bale.ai") {
        const uid = url.searchParams.get("uid");
        if (uid) {
            return `${hostname}_${uid}`;
        }
    }

    return hostname;
}

async function get_secret_key() {
    const storageKey = get_storage_key();
    const storage = await chrome.storage.local.get([storageKey]);
    return storage[storageKey];
}

async function set_secret_key(key) {
    const storageKey = get_storage_key();
    await chrome.storage.local.set({ [storageKey]: key });
}

function is_in_chat() {
    const adapter = get_active_messenger_adapter();
    if (adapter?.is_in_chat) {
        return adapter.is_in_chat();
    }

    return get_storage_key().includes("_");
}

function get_chat_id_from_url() {
    const url = new URL(window.location.href);
    return url.searchParams.get("uid");
}
