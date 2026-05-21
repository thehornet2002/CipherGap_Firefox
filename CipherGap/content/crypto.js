
// crypto.js

async function encrypt_message(
    message,
    password
) {

    const encoder =
        new TextEncoder();

    const passwordBytes =
        encoder.encode(password);

    const passwordHash =
        await crypto.subtle.digest(
            "SHA-256",
            passwordBytes
        );

    const cryptoKey =
        await crypto.subtle.importKey(
            "raw",
            passwordHash,
            {
                name: "AES-GCM"
            },
            false,
            ["encrypt"]
        );

    const iv =
        crypto.getRandomValues(
            new Uint8Array(12)
        );

    const encryptedBuffer =
        await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv
            },
            cryptoKey,
            encoder.encode(message)
        );

    const encryptedArray =
        new Uint8Array(
            encryptedBuffer
        );

    const combined =
        new Uint8Array(
            iv.length +
            encryptedArray.length
        );

    combined.set(iv);

    combined.set(
        encryptedArray,
        iv.length
    );

    return btoa(
        String.fromCharCode(
            ...combined
        )
    );
}

// =========================
// Decrypt Message
// =========================

async function decrypt_message(
    encryptedMessage,
    password
) {

    try {

        console.log(
            "Encrypted Input:",
            encryptedMessage
        );

        const encoder =
            new TextEncoder();

        const decoder =
            new TextDecoder();

        // password -> sha256
        const passwordBytes =
            encoder.encode(password);

        const passwordHash =
            await crypto.subtle.digest(
                "SHA-256",
                passwordBytes
            );

        console.log(
            "Password Hash Ready"
        );

        // import key
        const cryptoKey =
            await crypto.subtle.importKey(
                "raw",
                passwordHash,
                {
                    name: "AES-GCM"
                },
                false,
                ["decrypt"]
            );

        console.log(
            "CryptoKey Ready"
        );

        // normalize base64
        encryptedMessage =
            encryptedMessage.trim();

        // decode base64
        const binary =
            atob(encryptedMessage);

        console.log(
            "Base64 Decoded"
        );

        const combined =
            Uint8Array.from(
                binary,
                char =>
                    char.charCodeAt(0)
            );

        console.log(
            "Combined Length:",
            combined.length
        );

        // iv
        const iv =
            combined.slice(0, 12);

        // encrypted body
        const encryptedData =
            combined.slice(12);

        console.log(
            "IV Length:",
            iv.length
        );

        console.log(
            "Encrypted Length:",
            encryptedData.length
        );

        // decrypt
        const decryptedBuffer =
            await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv
                },
                cryptoKey,
                encryptedData
            );

        console.log(
            "Decrypt Success"
        );

        return decoder.decode(
            decryptedBuffer
        );

    } catch (error) {

        console.error(
            "DECRYPT FAILED",
            error
        );

        throw error;

    }

}