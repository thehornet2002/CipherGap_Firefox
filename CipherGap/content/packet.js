
// packet.js

function build_ciphergap_packet(
    encryptedPayload
) {

    const protocol =
        "CGP";

    const version =
        "1";

    const algorithm =
        "AESGCM";

    const timestamp =
        Math.floor(
            Date.now() / 1000
        );

    return [
        protocol,
        version,
        algorithm,
        timestamp,
        encryptedPayload
    ].join("|");
}



// =========================
// Parse CipherGap Packet
// =========================

function parse_ciphergap_packet(
    packet
) {

    if (!packet) {
        return null;
    }

    const parts =
        packet.trim().split("|");

    // فرمت:
    // CGP|1|AESGCM|timestamp|data

    if (parts.length < 5) {
        return null;
    }

    if (parts[0] !== "CGP") {
        return null;
    }

    return {

        version:
            parts[1],

        algorithm:
            parts[2],

        timestamp:
            parts[3],

        data:
            parts.slice(4).join("|")

    };

}