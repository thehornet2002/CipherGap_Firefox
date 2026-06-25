globalThis.cgApi = globalThis.browser ?? globalThis.chrome;

// background.js

globalThis.cgApi.runtime.onInstalled.addListener(() => {
    console.log("[CipherGap] Extension installed");
});
