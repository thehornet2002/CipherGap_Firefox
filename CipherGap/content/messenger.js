
// messenger.js

function messenger_detection() {
    const adapter = get_active_messenger_adapter();

    console.log("Detecting messenger:", window.location.hostname);

    if (adapter) {
        adapter.inject_ui?.();
        return {
            detected: true,
            messenger: adapter.name
        };
    }

    return {
        detected: false,
        messenger: null
    };
}
