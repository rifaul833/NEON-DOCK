/**
 * GameBox token crypto (matches vendor test.js).
 * AES-128-CBC + HMAC-SHA256(mac:key) + zlib DeflateRaw/InflateRaw + Base64URL.
 * AES key = UTF-8 passphrase zero-padded to 16 bytes.
 * IV = SHA-256("iv:" + key)[:16]
 * MAC key = SHA-256("mac:" + key)
 */
(function (global) {
  "use strict";

  const DEFAULT_LAUNCH_KEY = "J9k8L7m6N5p4Q3r2";

  function bytesToBase64Url(bytes) {
    let binary = "";
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlToBytes(value) {
    if (!value) throw new Error("Missing base64url value");
    let base64 = String(value).replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const binary = atob(base64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }

  function getKeyBuffer(key) {
    const bytes = new TextEncoder().encode(String(key || ""));
    if (bytes.length > 16) {
      throw new Error("decryptionKey must be 16 characters or fewer");
    }
    const out = new Uint8Array(16);
    out.set(bytes);
    return out;
  }

  async function sha256Bytes(text) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text),
    );
    return new Uint8Array(digest);
  }

  async function getIv(key) {
    const hash = await sha256Bytes("iv:" + key);
    return hash.slice(0, 16);
  }

  async function getMacKey(key) {
    return sha256Bytes("mac:" + key);
  }

  async function createMac(ciphertext, key) {
    const macKey = await getMacKey(key);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      macKey,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, ciphertext);
    return new Uint8Array(sig);
  }

  async function importAesKey(rawKey) {
    return crypto.subtle.importKey("raw", rawKey, { name: "AES-CBC" }, false, [
      "encrypt",
      "decrypt",
    ]);
  }

  function requirePako() {
    if (!global.pako) throw new Error("pako is required for GameBox compression");
    return global.pako;
  }

  async function decryptToken(encryptedString, decryptionKey) {
    if (!encryptedString) throw new Error("encryptedString is required");
    if (!decryptionKey) throw new Error("decryption key is required");

    const tokenJson = new TextDecoder().decode(
      base64UrlToBytes(String(encryptedString).trim()),
    );
    const token = JSON.parse(tokenJson);
    if (token.v !== 1 || !token.ct || !token.mac) {
      throw new Error("Invalid token structure");
    }

    const ciphertext = base64UrlToBytes(token.ct);
    const receivedMac = base64UrlToBytes(token.mac);
    const expectedMac = await createMac(ciphertext, decryptionKey);

    if (receivedMac.length !== expectedMac.length) {
      throw new Error("MAC validation failed");
    }
    let macOk = true;
    for (let i = 0; i < receivedMac.length; i++) {
      if (receivedMac[i] !== expectedMac[i]) macOk = false;
    }
    if (!macOk) throw new Error("MAC validation failed");

    const aesKey = await importAesKey(getKeyBuffer(decryptionKey));
    const iv = await getIv(decryptionKey);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      aesKey,
      ciphertext,
    );
    const inflated = requirePako().inflateRaw(new Uint8Array(decrypted));
    return JSON.parse(new TextDecoder().decode(inflated));
  }

  async function encryptToken(payload, encryptionKey) {
    const json = JSON.stringify(payload);
    const compressed = requirePako().deflateRaw(new TextEncoder().encode(json));
    const aesKey = await importAesKey(getKeyBuffer(encryptionKey));
    const iv = await getIv(encryptionKey);
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt({ name: "AES-CBC", iv }, aesKey, compressed),
    );
    const mac = await createMac(ciphertext, encryptionKey);
    const token = {
      v: 1,
      ct: bytesToBase64Url(ciphertext),
      mac: bytesToBase64Url(mac),
    };
    return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(token)));
  }

  global.GameBoxCrypto = {
    DEFAULT_LAUNCH_KEY,
    bytesToBase64Url,
    base64UrlToBytes,
    getKeyBuffer,
    getIv,
    getMacKey,
    createMac,
    decryptToken,
    encryptToken,
  };
})(typeof window !== "undefined" ? window : globalThis);
