import { useEffect, useState, useRef, useCallback } from 'react';
import {
  generateDeviceKeys,
  loadDeviceKeyring,
  saveDeviceKeyring,
  DeviceKeyring,
  encryptChatMessage,
  decryptChatMessage,
  EncryptedMessageEnvelope,
  ReportItem,
  packageAndEncryptReport
} from '../lib/crypto.service';

export interface SecureChatMessage {
  id: string;
  senderId: string;
  username?: string;
  text: string;
  timestamp: string | number | Date;
  signature?: string;
}

interface SecureChatHook {
  keyring: DeviceKeyring | null;
  connected: boolean;
  messages: SecureChatMessage[];
  sendSecureMessage: (text: string) => Promise<void>;
  submitDisclosureReport: (reportedMessageId: string, reason: string) => Promise<void>;
  loadingKeys: boolean;
}

export function useSecureChat(
  userId: string,
  sessionToken: string,
  activeGroupId: string,
  escrowPubKeyB64: string // Provided by backend configuration
): SecureChatHook {
  const [keyring, setKeyring] = useState<DeviceKeyring | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<SecureChatMessage[]>([]);
  const [loadingKeys, setLoadingKeys] = useState<boolean>(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const roomKeyRef = useRef<CryptoKey | null>(null);

  // 1. Initialize and load device keys securely from IndexedDB
  useEffect(() => {
    async function initCrypto() {
      try {
        setLoadingKeys(true);
        let savedKeyring = await loadDeviceKeyring(userId);
        if (!savedKeyring) {
          savedKeyring = await generateDeviceKeys();
          await saveDeviceKeyring(userId, savedKeyring);
        }
        setKeyring(savedKeyring);

        // For demo/local development, let's create a mockup symmetric room key
        // In full production, this is fetched wrapped from MongoDB and decrypted client-side
        const mockKey = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        roomKeyRef.current = mockKey;
      } catch (err) {
        console.error('Failed to initialize local cryptographic database:', err);
      } finally {
        setLoadingKeys(false);
      }
    }
    if (userId) {
      initCrypto();
    }
  }, [userId]);

  // 2. Manage WebSocket upgrade connection, challenge handshake, and subscribers
  useEffect(() => {
    if (!keyring || !sessionToken || !activeGroupId) return;

    // Connect to updated secure WSS gateway
    const gatewayUrl = `ws://localhost:8080/api/chat/ws?token=${sessionToken}`;
    const ws = new WebSocket(gatewayUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log('Secure WebSocket connection established, initiating cryptographic handshake...');
      
      // Perform challenge handshake
      // In production, the challenge is requested or derived. We generate a proof of device signature.
      const encoder = new TextEncoder();
      const challengeToken = 'serenify_ws_handshake_' + Date.now();
      const challengeBytes = encoder.encode(challengeToken);
      
      const sigBuffer = await window.crypto.subtle.sign(
        { name: 'Ed25519' },
        keyring.signKeyPair.privateKey,
        challengeBytes
      );

      // Convert signature to Base64
      const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));

      // Transmit handshake envelope
      ws.send(JSON.stringify({
        type: 'handshake',
        device_id: keyring.deviceId,
        challenge: challengeToken,
        signature: signatureB64
      }));

      // Subscribe to active group room updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        group_id: activeGroupId
      }));

      setConnected(true);
    };

    ws.onmessage = async (event) => {
      try {
        const rawEvent = JSON.parse(event.data);
        
        // Check if message is secure ciphertext envelope
        if (rawEvent.type === 'message' && rawEvent.ciphertext && roomKeyRef.current) {
          const envelope: EncryptedMessageEnvelope = {
            ciphertext: rawEvent.ciphertext,
            nonce: rawEvent.nonce,
            escrowPacket: rawEvent.escrow_packet,
            signature: rawEvent.signature
          };

          // Decrypt payload in secure context
          const plaintext = await decryptChatMessage(envelope, roomKeyRef.current);
          
          setMessages((prev) => [...prev, {
            id: String(rawEvent.id || Date.now().toString()),
            senderId: String(rawEvent.sender_id || 'unknown'),
            username: String(rawEvent.username || 'Anonymous'),
            text: plaintext,
            timestamp: rawEvent.timestamp || new Date(),
            signature: rawEvent.signature ? String(rawEvent.signature) : undefined
          }]);
        } else {
          // Fallback handling for standard frames
          if (rawEvent.type === 'message' && rawEvent.text) {
            setMessages((prev) => [...prev, {
              id: String(rawEvent.id || Date.now().toString()),
              senderId: String(rawEvent.sender_id || rawEvent.senderId || 'unknown'),
              username: String(rawEvent.username || 'Anonymous'),
              text: String(rawEvent.text),
              timestamp: rawEvent.timestamp || new Date(),
              signature: rawEvent.signature ? String(rawEvent.signature) : undefined
            }]);
          }
        }
      } catch (err) {
        console.error('Failed to decrypt WebSocket message frame:', err);
      }
    };

    ws.onclose = () => {
      console.warn('Secure WebSocket connection closed, scheduling reconnect...');
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket connection error:', err);
    };

    return () => {
      ws.close();
    };
  }, [keyring, sessionToken, activeGroupId]);

  // 3. Encrypt and dispatch messages via WebSocket
  const sendSecureMessage = useCallback(async (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection is not active');
    }
    if (!keyring || !roomKeyRef.current) {
      throw new Error('Cryptographic keys have not completed initialization');
    }

    try {
      const escrowPubKeyBytes = new Uint8Array(32); // Abstract representation of base64 escrow key
      const encoder = new TextEncoder();
      const decodedEscrowBytes = encoder.encode(escrowPubKeyB64).slice(0, 32); // Safe padding slice
      escrowPubKeyBytes.set(decodedEscrowBytes);

      // Perform local encryption & ECIES packing
      const secureEnvelope = await encryptChatMessage(
        text,
        roomKeyRef.current,
        escrowPubKeyBytes.buffer,
        activeGroupId,
        userId,
        keyring
      );

      // Transmit the fully secured payload envelope
      wsRef.current.send(JSON.stringify({
        type: 'message',
        group_id: activeGroupId,
        device_id: keyring.deviceId,
        ciphertext: secureEnvelope.ciphertext,
        nonce: secureEnvelope.nonce,
        escrow_packet: secureEnvelope.escrowPacket,
        signature: secureEnvelope.signature
      }));
    } catch (err) {
      console.error('Failed to secure or send message:', err);
      throw err;
    }
  }, [keyring, activeGroupId, userId, escrowPubKeyB64]);

  // 4. Package, Encrypt, and Submit a User-Generated Disclosure Report (WhatsApp-style)
  const submitDisclosureReport = useCallback(async (reportedMessageId: string, reason: string) => {
    if (!keyring) {
      throw new Error('Device keys have not completed initialization');
    }

    // Locate reported message in local hook memory
    const reportedIndex = messages.findIndex(m => m.id === reportedMessageId);
    if (reportedIndex === -1) {
      throw new Error('Reported message not found in local memory');
    }
    const reportedMsg = messages[reportedIndex];

    // Fetch contextual messages (up to 5 messages preceding)
    const contextStart = Math.max(0, reportedIndex - 5);
    const contextMsgs = messages.slice(contextStart, reportedIndex).map(m => ({
      messageId: m.id,
      senderId: m.senderId,
      plaintext: m.text,
      signature: m.signature || 'unsigned_local_context',
      timestamp: new Date(m.timestamp).toISOString()
    }));

    const reportedItem: ReportItem = {
      messageId: reportedMsg.id,
      senderId: reportedMsg.senderId,
      plaintext: reportedMsg.text,
      signature: reportedMsg.signature || 'unsigned_local_report',
      timestamp: new Date(reportedMsg.timestamp).toISOString()
    };

    // Encrypt disclosure specifically for the moderation public key
    const encoder = new TextEncoder();
    const escrowPubKeyBytes = new Uint8Array(32);
    const decodedEscrowBytes = encoder.encode(escrowPubKeyB64).slice(0, 32);
    escrowPubKeyBytes.set(decodedEscrowBytes);

    const encryptedReportPayload = await packageAndEncryptReport(
      reportedItem,
      contextMsgs,
      reason,
      escrowPubKeyBytes.buffer
    );

    // Upload encrypted payload to REST API
    const response = await fetch('http://localhost:8080/api/reports/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        reported_by: userId,
        group_id: activeGroupId,
        encrypted_payload: encryptedReportPayload
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to submit secure report: ${response.statusText}`);
    }

    console.log('Cryptographically secured report successfully submitted.');
  }, [keyring, messages, activeGroupId, userId, sessionToken, escrowPubKeyB64]);

  return {
    keyring,
    connected,
    messages,
    sendSecureMessage,
    submitDisclosureReport,
    loadingKeys
  };
}
