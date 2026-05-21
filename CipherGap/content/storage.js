
// storage.js

 function get_storage_key() {

    const url =
        new URL(window.location.href);

    const hostname =
        url.hostname;

    if (hostname === "web.bale.ai") {

        const uid =
            url.searchParams.get("uid");

        if (uid) {

            return `${hostname}_${uid}`;
        }
    }

    return hostname;
}

 async function get_secret_key() {

    const storageKey =
        get_storage_key();

    const storage =
        await chrome.storage.local.get(
            [storageKey]
        );

    return storage[storageKey];
}

