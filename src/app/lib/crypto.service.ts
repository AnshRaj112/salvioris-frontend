/**
 * Serenify Frontend Cryptographic Service Layer
 * Powered by the native Web Crypto API for high-security, high-performance, and zero-dependency operations.
 */

export interface DeviceKeyring {
  deviceId: string;
  signKeyPair: CryptoKeyPair;
  encKeyPair: CryptoKeyPair;
}

export interface EncryptedMessageEnvelope {
  ciphertext: string; // Base64
  nonce: string;      // Base64 (12 bytes)
  escrowPacket: string; // Base64
  signature: string;    // Base64
}

// 1. IndexedDB Helper to persist raw keys securely without local storage
const DB_NAME = 'SerenifyKeys';
const STORE_NAME = 'keyring';

function openKeyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDeviceKeyring(userId: string, keyring: DeviceKeyring): Promise<void> {
  const db = await openKeyDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Save keys directly as non-extractable CryptoKeys
    const request = store.put({
      deviceId: keyring.deviceId,
      signKeyPair: keyring.signKeyPair,
      encKeyPair: keyring.encKeyPair
    }, userId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadDeviceKeyring(userId: string): Promise<DeviceKeyring | null> {
  const db = await openKeyDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(userId);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result as DeviceKeyring);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Helper to convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// 2. Generate Brand-New Secure Device Keys (Ed25519 & X25519)
export async function generateDeviceKeys(): Promise<DeviceKeyring> {
  // Generate Ed25519 Keypair for Identity & Message Signing
  const signKeyPair = (await window.crypto.subtle.generateKey(
    {
      name: 'Ed25519'
    },
    false, // Private key is non-extractable from memory
    ['sign', 'verify']
  )) as CryptoKeyPair;

  // Generate X25519 Keypair for Ephemeral Encryption & ECDH
  const encKeyPair = (await window.crypto.subtle.generateKey(
    {
      name: 'X25519'
    },
    false, // Non-extractable
    ['deriveKey', 'deriveBits']
  )) as CryptoKeyPair;

  // Generate a cryptographically secure 16-byte random Device ID
  const deviceIdBuffer = window.crypto.getRandomValues(new Uint8Array(16));
  const deviceId = Array.from(deviceIdBuffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    deviceId,
    signKeyPair,
    encKeyPair
  };
}

// 3. Client Message Encryption Pipeline (AES-GCM & ECIES-X25519 Escrow)
export async function encryptChatMessage(
  plaintext: string,
  roomKey: CryptoKey, // Symmetric group key (AES-GCM)
  escrowPubKeyBytes: ArrayBuffer, // Server's X25519 moderation public key
  groupId: string,
  senderId: string,
  keyring: DeviceKeyring
): Promise<EncryptedMessageEnvelope> {
  
  // 1. Generate an ephemeral 32-byte message key K_msg
  const rawKMsg = window.crypto.getRandomValues(new Uint8Array(32));
  const kMsg = await window.crypto.subtle.importKey(
    'raw',
    rawKMsg,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // 2. Encrypt plaintext message with K_msg
  const msgNonce = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit GCM Nonce
  const encoder = new TextEncoder();
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: msgNonce
    },
    kMsg,
    encoder.encode(plaintext)
  );

  // 3. Wrap K_msg under server's escrow public key using ECIES-X25519
  // Generate an ephemeral X25519 keypair for ECDH
  const ephKeyPair = (await window.crypto.subtle.generateKey(
    { name: 'X25519' },
    true, // Ephemeral public key must be extractable
    ['deriveKey']
  )) as CryptoKeyPair;

  const recipientPubKey = await window.crypto.subtle.importKey(
    'raw',
    escrowPubKeyBytes,
    { name: 'X25519' },
    true,
    []
  );

  // Deriving the Key Encryption Key (KEK) using ECDH shared secret
  const kek = await window.crypto.subtle.deriveKey(
    {
      name: 'X25519',
      public: recipientPubKey
    },
    ephKeyPair.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Encrypt the raw message key with KEK
  const escrowNonce = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedKMsg = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: escrowNonce
    },
    kek,
    rawKMsg
  );

  // Ephemeral public key export
  const ephPubRaw = await window.crypto.subtle.exportKey('raw', ephKeyPair.publicKey);

  // Construct Escrow Packet: ephPub (32) + nonce (12) + encryptedKMsg
  const escrowPacket = new Uint8Array(32 + 12 + encryptedKMsg.byteLength);
  escrowPacket.set(new Uint8Array(ephPubRaw), 0);
  escrowPacket.set(escrowNonce, 32);
  escrowPacket.set(new Uint8Array(encryptedKMsg), 44);

  // 4. Compute cryptographic binding hash: Hash(C_msg || C_escrow || group_id || sender_id)
  const ciphertextB64 = bufferToBase64(ciphertextBuffer);
  const escrowPacketB64 = bufferToBase64(escrowPacket.buffer);

  const bindingData = encoder.encode(ciphertextB64 + escrowPacketB64 + groupId + senderId);
  const bindingHash = await window.crypto.subtle.digest('SHA-256', bindingData);

  // 5. Sign the binding hash with our device signing private key
  const signatureBuffer = await window.crypto.subtle.sign(
    { name: 'Ed25519' },
    keyring.signKeyPair.privateKey,
    bindingHash
  );

  return {
    ciphertext: ciphertextB64,
    nonce: bufferToBase64(msgNonce.buffer),
    escrowPacket: escrowPacketB64,
    signature: bufferToBase64(signatureBuffer)
  };
}

// 4. Client Decryption helper for normal group operations (decrypting with room key)
export async function decryptChatMessage(
  envelope: EncryptedMessageEnvelope,
  roomKey: CryptoKey
): Promise<string> {
  const ciphertext = base64ToBuffer(envelope.ciphertext);
  const nonce = base64ToBuffer(envelope.nonce);

  // Recipient decrypts the payload directly with K_room or K_msg if derived
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(nonce)
    },
    roomKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

export interface ReportItem {
  messageId: string;
  senderId: string;
  plaintext: string;
  signature: string;
  timestamp: string;
}

export interface DisclosurePayload {
  reportedMessage: ReportItem;
  contextMessages: Array<ReportItem>;
  reportReason: string;
}

export async function packageAndEncryptReport(
  reportedMessage: ReportItem,
  contextMessages: Array<ReportItem>,
  reportReason: string,
  moderationPubKeyBytes: ArrayBuffer | Uint8Array
): Promise<string> {
  const encoder = new TextEncoder();

  // Normalize key data to exactly 32 bytes (256 bits) for raw X25519 import
  let rawKeyBytes = new Uint8Array(moderationPubKeyBytes);
  if (rawKeyBytes.length === 44) {
    rawKeyBytes = rawKeyBytes.slice(12); // Extricates the raw 32-byte X25519 public key from the SPKI envelope
  }
  if (rawKeyBytes.length !== 32) {
    throw new Error(`X25519 key data must be exactly 256 bits (32 bytes), received: ${rawKeyBytes.length} bytes`);
  }

  // Package the reported messages and contexts
  const payload: DisclosurePayload = {
    reportedMessage,
    contextMessages,
    reportReason
  };

  const payloadString = JSON.stringify(payload);
  const payloadBytes = encoder.encode(payloadString);

  // Generate an ephemeral X25519 key for report encryption
  const ephKeyPair = (await window.crypto.subtle.generateKey(
    { name: 'X25519' },
    true,
    ['deriveKey']
  )) as CryptoKeyPair;

  const recipientPubKey = await window.crypto.subtle.importKey(
    'raw',
    rawKeyBytes,
    { name: 'X25519' },
    true,
    []
  );

  // Derive KEK via ECDH
  const kek = await window.crypto.subtle.deriveKey(
    {
      name: 'X25519',
      public: recipientPubKey
    },
    ephKeyPair.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Encrypt the payload
  const nonce = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedPayload = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce
    },
    kek,
    payloadBytes
  );

  // Export ephemeral public key
  const ephPubRaw = await window.crypto.subtle.exportKey('raw', ephKeyPair.publicKey);

  // Assemble package: ephPub (32) + nonce (12) + encryptedPayload
  const reportPackage = new Uint8Array(32 + 12 + encryptedPayload.byteLength);
  reportPackage.set(new Uint8Array(ephPubRaw), 0);
  reportPackage.set(nonce, 32);
  reportPackage.set(new Uint8Array(encryptedPayload), 44);

  return bufferToBase64(reportPackage.buffer);
}

/**
 * Derives a cryptographically strong 256-bit symmetric key from a master secret and salt using HKDF-SHA256
 */
export async function deriveHKDFKey(masterSecret: ArrayBuffer, salt: ArrayBuffer, info: ArrayBuffer): Promise<CryptoKey> {
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    masterSecret,
    'HKDF',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: info
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // Non-extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates an ephemeral cryptographic room key (AES-256-GCM)
 */
export async function generateRoomKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    false, // Must not be extractable to prevent client leakage scripts
    ['encrypt', 'decrypt']
  );
}

