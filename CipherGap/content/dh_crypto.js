// dh_crypto.js — ECDH (P-256) key exchange via Web Crypto API

const ECDH_CURVE = "P-256";

async function generate_ecdh_keypair() {
    return crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: ECDH_CURVE },
        true,
        ["deriveBits"]
    );
}

async function export_public_key_b64(publicKey) {
    const spki = await crypto.subtle.exportKey("spki", publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(spki)));
}

async function import_public_key_b64(publicKeyB64) {
    const binary = Uint8Array.from(atob(publicKeyB64.trim()), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey(
        "spki",
        binary,
        { name: "ECDH", namedCurve: ECDH_CURVE },
        true,
        []
    );
}

async function derive_shared_secret_string(privateKey, peerPublicKeyB64) {
    const peerPublicKey = await import_public_key_b64(peerPublicKeyB64);
    const sharedBits = await crypto.subtle.deriveBits(
        { name: "ECDH", public: peerPublicKey },
        privateKey,
        256
    );
    const hash = await crypto.subtle.digest("SHA-256", sharedBits);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function create_dh_session() {
    const keyPair = await generate_ecdh_keypair();
    const publicKeyB64 = await export_public_key_b64(keyPair.publicKey);
    const nonce = generate_exchange_nonce();
    return {
        privateKey: keyPair.privateKey,
        publicKeyB64,
        nonce
    };
}

function generate_exchange_nonce() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Derive a 6-digit Short Authentication String (SAS) from the shared secret.
// Both parties independently compute the same SAS and compare it out-of-band
// (e.g. voice call) to verify no MITM occurred during key exchange.
async function derive_sas(sharedSecretB64) {
    const secretBytes = Uint8Array.from(atob(sharedSecretB64.trim()), (c) => c.charCodeAt(0));
    const hash = await crypto.subtle.digest("SHA-256", secretBytes);
    const hashArray = new Uint8Array(hash);

    // Take 20 bits (enough for a 6-digit decimal number: 0–999999)
    const value =
        (hashArray[0] << 12) |
        (hashArray[1] << 4) |
        (hashArray[2] >> 4);

    return String(value % 1000000).padStart(6, "0");
}

// Compute a short fingerprint for a public key (first 8 hex chars of SHA-256).
// Used for TOFU (Trust On First Use) to detect future key changes.
async function compute_key_fingerprint(publicKeyB64) {
    const keyBytes = Uint8Array.from(atob(publicKeyB64.trim()), (c) => c.charCodeAt(0));
    const hash = await crypto.subtle.digest("SHA-256", keyBytes);
    const hex = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
    return hex.slice(0, 8).toUpperCase();
}
