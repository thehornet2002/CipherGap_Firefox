
// messenger.js

function messenger_detection() {

    const hostname =
        window.location.hostname;

    console.log(
        "Detecting messenger:",
        hostname
    );

    if (
        hostname.startsWith(
            "web.bale.ai"
        )
    ) {

        const baleChatInput =
            document.querySelector(
                "#editable-message-text"
            );

        if (baleChatInput) {

            inject_encrypt_button_bale();

            return {
                detected: true,
                messenger: "bale",
                input: baleChatInput
            };
        }

        return {
            detected: false,
            messenger: "bale"
        };
    }

    return {
        detected: false,
        messenger: null
    };
}

