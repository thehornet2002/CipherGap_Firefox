# CipherGap 🔒

**CipherGap** is an open-source Firefox extension that adds client-side encryption to popular Iranian web messengers, including **Eitaa**, **Rubika**, and **Bale**.

Messages are encrypted locally in your browser before being sent, ensuring that only users with the shared secret can read the original content.

## Features

* 🔐 Client-side message encryption
* ⚡ AES-based symmetric cryptography
* 🌐 Supports Eitaa, Rubika, and Bale Web
* 🧩 Lightweight Firefox WebExtension
* 🔍 Fully open source and auditable
* 🚫 No external servers or cloud processing

## Installation

### Manual Installation for Development / Testing

```bash
git clone https://github.com/thehornet2002/CipherGap_Firefox.git
```

1. Open Firefox.
2. Go to:

```text
about:debugging#/runtime/this-firefox
```

3. Click **Load Temporary Add-on**.
4. Select the `manifest.json` file inside the cloned `CipherGap` directory.

The extension is now ready to use in Firefox.

> Note: Temporary add-ons are removed when Firefox is restarted. For permanent installation, the extension must be packaged and signed through Mozilla Add-ons.

## Usage

1. Open Eitaa, Rubika, or Bale Web.
2. Click the CipherGap extension icon.
3. Enter or configure a shared encryption key.
4. Send encrypted messages normally.
5. Recipients using the same key can decrypt and read the messages.

## Tech Stack

* JavaScript
* HTML/CSS
* Firefox WebExtensions API
* AES Encryption

## Security

* Encryption and decryption occur entirely on the client side.
* No message content is transmitted to third-party services.
* Source code is publicly available for review and auditing.

> CipherGap improves privacy on supported messaging platforms, but users should independently review the cryptographic implementation before relying on it for highly sensitive communications.

## Contributing

Contributions, bug reports, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

Released under the MIT License.

---

⭐ If you find CipherGap useful, consider starring the repository.

<img src="./docs/ext.png">
<img src="./docs/chat.png">
<img src="./docs/chat1.png">
<img src="./docs/chat2.png">
