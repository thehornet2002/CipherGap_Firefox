// messenger_adapter.js — platform-agnostic messenger interface

const messenger_adapters = {};

function register_messenger_adapter(name, adapter) {
    messenger_adapters[name] = { name, ...adapter };
}

function get_active_messenger_adapter() {
    for (const adapter of Object.values(messenger_adapters)) {
        if (adapter.is_active?.()) {
            return adapter;
        }
    }
    return null;
}

function get_messenger_adapter_by_hostname(hostname) {
    for (const adapter of Object.values(messenger_adapters)) {
        if (adapter.hostnames?.includes(hostname)) {
            return adapter;
        }
    }
    return null;
}
