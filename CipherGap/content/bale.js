// bale.js

// =========================
// Inject Encrypt Button
// =========================

function inject_encrypt_button_bale() {

    if (
        document.getElementById(
            "ciphergap-btn"
        )
    ) {
        return;
    }

    const chatFooter =
        document.getElementById(
            "chat_footer"
        );

    if (!chatFooter) {
        return;
    }

    const footerContainer =
        chatFooter.querySelector(
            "div"
        );

    if (!footerContainer) {
        return;
    }

    const button =
        document.createElement(
            "button"
        );

    button.id =
        "ciphergap-btn";

    button.innerText =
        "🔐";

    Object.assign(
        button.style,
        {
            width: "42px",
            height: "42px",
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            marginLeft: "8px",
            fontSize: "18px",
            background: "#2563eb",
            color: "white"
        }
    );

    button.addEventListener(
        "click",
        async () => {

            try {

                button.disabled =
                    true;

                const input =
                    document.querySelector(
                        "#editable-message-text"
                    );

                if (!input) {
                    return;
                }

                const plainText =
                    input.textContent?.trim();

                if (!plainText) {
                    return;
                }

                const secretKey =
                    await get_secret_key();

                if (!secretKey) {

                    alert(
                        "No key configured"
                    );

                    return;
                }

                const encryptedMessage =
                    await encrypt_message(
                        plainText,
                        secretKey
                    );

                const finalMessage =
                    build_ciphergap_packet(
                        encryptedMessage
                    );

                input.textContent =
                    finalMessage;

                input.dispatchEvent(
                    new Event(
                        "input",
                        {
                            bubbles: true
                        }
                    )
                );

                const sendButton =
                    document.querySelector(
                        '[aria-label="send-button"]'
                    );

                sendButton?.click();

            } catch (error) {

                console.error(
                    error
                );

            } finally {

                button.disabled =
                    false;
            }
        }
    );

    footerContainer.insertBefore(
        button,
        footerContainer.children[4]
    );
}

// =========================
// Utils
// =========================

function is_ciphergap_packet(
    text
) {

    if (!text) {
        return false;
    }

    return text
        .trim()
        .startsWith("CGP|");

}

function create_decrypt_button() {

    const button =
        document.createElement(
            "button"
        );

    button.innerText =
        "Decrypt";

    Object.assign(
        button.style,
        {
            marginBottom: "6px",
            padding: "4px 8px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "11px",
            background: "#16a34a",
            color: "white"
        }
    );

    return button;

}
function extract_message_text(
    messageElement
) {

    const spans =
        messageElement.querySelectorAll(
            "span"
        );

    for (const span of spans) {

        const text =
            span.innerText?.trim();

        if (
            text &&
            text.startsWith("CGP|")
        ) {

            return text;

        }

    }

    return "";

}

// =========================
// Replace Visual Text
// =========================

function replace_message_visual(
    messageElement,
    encryptedText,
    decryptedText
) {

    const spans =
        messageElement.querySelectorAll(
            "span"
        );

    if (!spans.length) {
        return;
    }

    const targetSpan =
        spans[0];

    targetSpan.innerText =
        `${encryptedText}\n---\n${decryptedText}`;

}

// =========================
// Process Message
// =========================

async function process_bale_message(
    messageElement
) {

    if (
        !messageElement
    ) {
        return;
    }

    if (
        messageElement.dataset
            .ciphergapProcessed
    ) {
        return;
    }

    messageElement.dataset
        .ciphergapProcessed =
        "true";

    const text =
        extract_message_text(
            messageElement
        );

    if (!text) {
        return;
    }

    if (
        !is_ciphergap_packet(
            text
        )
    ) {
        return;
    }

    const decryptButton =
        create_decrypt_button();

    decryptButton.addEventListener(
        "click",
        async event => {
            // try {
                
                event.preventDefault();
                event.stopPropagation();

                decryptButton.disabled =
                    true;
                
                const currentText =
                    extract_message_text(
                        messageElement
                    );

                if (
                    !is_ciphergap_packet(
                        currentText
                    )
                ) {
                    return;
                }

                const secretKey =
                    await get_secret_key();

                if (!secretKey) {

                    alert(
                        "No key configured"
                    );

                    return;
                }
                
                const packet =
                    parse_ciphergap_packet(
                        currentText
                    );

                if (!packet) {
                    return;
                }
                console.debug(packet);
                console.log("RAW:", currentText);

                console.log(
                    "PACKET:",
                    packet
                );

                console.log(
                    "BASE64:",
                    packet.data
                );
                const decryptedText =
                    await decrypt_message(
                        packet.data,
                        secretKey
                    );
                
                replace_message_visual(
                    messageElement,
                    currentText,
                    decryptedText
                );

            // } catch (error) {

                // console.error(
                //     error
                // );

            // } finally {

                decryptButton.disabled =
                    false;
            // }

        }
    );

    messageElement.children[0].children[0].children[0].children[0].appendChild(
        decryptButton
    );
}

// =========================
// Scan Messages
// =========================

function scan_bale_messages() {

    const scroller =
        document.querySelector(
            "[message_list_scroller_id]"
        );

    if (!scroller) {
        return;
    }

    const messages =
        scroller.querySelectorAll(
            "[data-sid]"
        );

    messages.forEach(
        process_bale_message
    );

}

// =========================
// Observe Messages
// =========================

function observe_bale_messages() {

    const interval =
        setInterval(() => {

            const scroller =
                document.querySelector(
                    "#message_list_scroller_id"
                );

            if (!scroller) {
                return;
            }

            clearInterval(
                interval
            );

            scan_bale_messages();

            const observer =
                new MutationObserver(
                    mutations => {

                        for (
                            const mutation
                            of mutations
                        ) {

                            mutation
                                .addedNodes
                                .forEach(
                                    node => {

                                        if (
                                            !(
                                                node instanceof HTMLElement
                                            )
                                        ) {
                                            return;
                                        }

                                        if (
                                            node.hasAttribute?.(
                                                "data-sid"
                                            )
                                        ) {

                                            process_bale_message(
                                                node
                                            );

                                        }

                                        const nested =
                                            node.querySelectorAll?.(
                                                "[data-sid]"
                                            );

                                        nested?.forEach(
                                            process_bale_message
                                        );

                                    }
                                );

                        }

                    }
                );

            observer.observe(
                scroller,
                {
                    childList: true,
                    subtree: true
                }
            );

            console.log(
                "[CipherGap] Bale observer initialized"
            );

        }, 1000);

}

// =========================
// Init
// =========================

observe_bale_messages();
