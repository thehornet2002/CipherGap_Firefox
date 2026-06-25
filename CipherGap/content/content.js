// content.js


console.log(
    `CipherGap version ${get_manifest_info().version} loaded`
);

window.addEventListener(
    "load",
    () => {

        messenger_detection();
        start_dom_observer();
    }
);

window.addEventListener(
    "focus",
    () => {

        messenger_detection();
    }
);


