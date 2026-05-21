
// observer.js

function start_dom_observer() {

    const observer =
        new MutationObserver(
            () => {

                messenger_detection();
            }
        );

    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );

    console.log(
        "CipherGap DOM observer started"
    );
}

