# Serenify Frontend Security & Cryptography Technical Specification

## Document Context & Scope
This specification details the client-side cryptographic systems, local browser sandbox boundaries, and zero-knowledge privacy layers implemented in the **Serenify Frontend Application**.

This document is compiled for security reviewers, privacy advocates, front-end engineers, and compliance auditors. It outlines how Serenify maintains absolute patient confidentiality through browser-level encryption, preventing the transmission of unencrypted Protected Health Information (PHI) to backend APIs.

---

## 🔒 1. Client-Side Cryptographic Specifications

The frontend implements a **Zero-Knowledge Architecture**. The client-side application does not trust the network transport or the backend storage layers. The browser serves as the exclusive boundary where plaintext clinical communications are generated, viewed, and decrypted.

```
       [ Patient Raw Message Input ]
                     │
                     ▼ (Web Worker Local Safety Scan)
       +───────────────────────────+
       |   Client Safety Scanner   | ──> [ Low Risk ] ──> Continue
       +───────────────────────────+
                     │
                     ▼ (E2EE Message Pipeline)
       +───────────────────────────+
       |  1. Generate 32B Ephemeral|
       |     AES-GCM Message Key   |
       +───────────────────────────+
                     │
                     ├───────────────┐
                     ▼ (Msg Crypt)   ▼ (Wrap Key - ECIES)
       +───────────────────────────+ +───────────────────────────+
       | 2. Encrypt Text with      | | 3. Derive KEK via X25519   |
       |    AES-256-GCM + Nonce    | |    ECDH with Server PubK  |
       +───────────────────────────+ +───────────────────────────+
                     │                               │
                     │                               ▼
                     │               +───────────────────────────+
                     │               | 4. Encrypt Message Key with|
                     │               |    KEK (AES-GCM)          |
                     │               +───────────────────────────+
                     │                               │
                     +───────────────┬───────────────+
                                     ▼
                     +───────────────────────────+
                     | 5. Sign SHA-256 Binding   |
                     |    Hash via Ed25519       |
                     +───────────────────────────+
                                     │
                                     ▼
                     [ Packed Message Envelope ]
```

### A. Cryptographic Algorithms and Standards
To ensure high-security, high-performance operations without introducing heavy library dependencies, Serenify relies on the standard browser **Web Crypto API**:

*   **Symmetric Messaging Cipher:** **AES-256-GCM** (Galois/Counter Mode). Every message generates a fresh, unique 32-byte key (`AES-GCM`) and a 12-byte cryptographically secure random Initialization Vector (Nonce) derived via `window.crypto.getRandomValues`.
*   **Asymmetric Key Agreement:** **X25519** (Curve25519). Used for Elliptic-Curve Diffie-Hellman (ECDH) operations to derive a Key Encryption Key (KEK) dynamically when wrapping message escrow keys.
*   **Digital Identity Signatures:** **Ed25519** (Edwards-curve Digital Signature Algorithm). Used to sign message headers, preventing man-in-the-middle message insertion or context tampering.
*   **Key Derivation Function (KDF):** **HKDF-SHA256** (HMAC-based Extract-and-Expand Key Derivation Function). Used to stretch master shared secrets and salts into cryptographically robust symmetric session keys.

---

## 💾 2. Zero-Knowledge Key Storage (IndexedDB)

*   **Target Code:** `src/app/lib/crypto.service.ts`
*   **Regulatory Alignment:** HIPAA §164.312(a)(2)(iv) (Encryption/Decryption controls) & §164.312(d) (Transmission security).

### XSS Mitigation and Non-Extractability
The primary vulnerability of client-side encryption is Cross-Site Scripting (XSS). If an attacker injects a malicious script, they could read keys stored in `localStorage` or `sessionStorage` and send them to an external server.

To neutralize this attack vector, Serenify configures all cryptographic keys under strict security parameters:
1.  **Generate Keys as Non-Extractable:** During `window.crypto.subtle.generateKey`, the `extractable` parameter is set explicitly to `false`. Once instantiated, the private key bits **cannot be read** by JavaScript execution contexts. The browser holds the key handle in memory but blocks access to the underlying key bytes.
2.  **IndexedDB Key Ring Persistency:** Keyrings are persisted inside **IndexedDB** (`IDBDatabase`). Web Crypto API allows non-extractable key objects to be directly saved and retrieved from object stores. Standard client-side scripts can invoke cryptographic operations (e.g. `sign` or `decrypt`) using the stored key handles, but cannot extract the raw private key parameters.

---

## 🛡️ 3. Governed Moderation Report Packaging (ECIES)

*   **Target Code:** `src/app/lib/crypto.service.ts`
*   **Logical Goal:** Create a secure, single-message report package readable only by the safety moderation team.

### ECIES Encryption Workflow (Client-Side)
When an active user submits an abuse report:
1.  **Package Collection:** The client gathers the metadata of the reported message: `messageId`, `senderId`, `plaintext`, `signature`, and `timestamp` (packaged in `ReportItem` interface), along with up to 3 adjacent messages for context.
2.  **JSON Serialization:** The compiled data is serialized into a JSON string and encoded to binary bytes using `TextEncoder`.
3.  **Ephemeral Key Generation:** An ephemeral X25519 keypair is generated: `EphKeyPair = generateKey('X25519')`.
4.  **Shared Secret Derivation:** The client derives a shared secret with the static **Server Moderation Public Key** using ECDH: `SharedSecret = deriveBits(EphKeyPair.privateKey, ServerModerationPublicKey)`.
5.  **KEK Derivation:** The derived secret is converted into a 256-bit AES-GCM Key Encryption Key (KEK).
6.  **Payload Encryption:** The serialized report payload is encrypted using **AES-256-GCM** with a fresh 12-byte nonce and the derived KEK.
7.  **Package Assembly:** The client exports the **Ephemeral Public Key** as raw bytes and compiles the final envelope:
    *   `Bytes[0-32]`: Ephemeral Public Key (32 bytes).
    *   `Bytes[32-44]`: Nonce (12 bytes).
    *   `Bytes[44+]`: Encrypted Payload.
8.  **Base64 Encoding:** The compiled package is Base64 encoded and submitted securely to the backend `/api/v1/moderation/submit` API.

---

## 🧠 4. On-Device Psychiatric Safety Scanning

*   **Target Code:** `src/app/lib/safety-worker.ts`
*   **Privacy Rationale:** Traditional systems scan text on centralized backend servers, violating the zero-trust E2EE boundary and creating a target for PHI leaks.

### Web Worker Architecture
1.  **Thread Isolation:** Text evaluation is executed inside a dedicated browser **Web Worker** thread. This ensures that keyword matching operations do not block the main UI thread, maintaining high performance during rapid typing.
2.  **Lexicon Filter:** The worker processes character streams against a local `CRISIS_LEXICON` containing critical distress indicators (e.g. indicators of acute self-harm).
3.  **Local Escalation Trigger:** If a match is flagged, the worker returns a `SafetyScore` object containing matching details. The main client UI intercepts this response and displays a local support modal.
4.  **Zero Telemetry Leakage:** The keyword matches, raw input strings, and safety scores are kept within local browser state. **No network telemetry is sent to the backend**, maintaining absolute patient privacy.

---

## 🌐 5. Next.js Sandbox & CSP Hardening

*   **Target Code:** `src/app/lib/headers.ts`
*   **Technical Safeguards:** Preventing clickjacking, XSS injections, and data extraction.

### HTTP Security Headers Configuration
The application injects strict response headers to govern browser execution boundaries:

*   **Content-Security-Policy (CSP):**
    *   `default-src 'self'`: Restricts all loading operations to the origin domain by default.
    *   `script-src 'self' 'unsafe-eval'`: Disables inline scripts to block reflective XSS exploits.
    *   `connect-src 'self' wss://api.serenify.app https://api.serenify.app`: Limits network connections strictly to the authenticated backend API and WebSocket endpoints, preventing unauthorized data exfiltration.
*   **X-Frame-Options (DENY):** Blocks the application from being loaded inside `<iframe>` or frame tags on third-party domains, mitigating clickjacking vulnerabilities.
*   **X-Content-Type-Options (nosniff):** Prevents browsers from executing payloads hidden within non-script files (e.g. images masquerading as JavaScript).
*   **Referrer-Policy (strict-origin-when-cross-origin):** Restricts the referrer header information shared with third-party sites during cross-origin routing.
