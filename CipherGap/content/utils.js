globalThis.cgApi = globalThis.browser ?? globalThis.chrome;


// utils.js

function get_manifest_info() {

    return globalThis.cgApi.runtime.getManifest();
}

