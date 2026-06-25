# CipherGap Firefox Extension

Converted Firefox WebExtension build.

## Temporary install in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `manifest.json` from this project folder.
4. Open one of the supported web messengers and test the popup.

## Notes

- This build uses Manifest V3.
- Chrome `background.service_worker` was replaced with Firefox-compatible `background.scripts`.
- Chrome API references were routed through `globalThis.cgApi`, which resolves to `browser` on Firefox and `chrome` where available.
- `popup/style.css` was renamed to `popup/popup.css` to match the project structure you provided.
- `content/decrypt.js` is included as an empty placeholder because it exists in your project structure.
