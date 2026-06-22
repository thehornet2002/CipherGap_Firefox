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
