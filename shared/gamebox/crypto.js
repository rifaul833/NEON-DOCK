/**
 * GameBox token crypto (v1.2 spec sections 4, 12, 13).
 * AES-128-CBC + HMAC-SHA256 + zlib DeflateRaw/InflateRaw + Base64URL.
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

  // Minimal MD5 — required because Web Crypto does not expose MD5.
  function md5Bytes(text) {
    function cmn(q, a, b, x, s, t) {
      a = add32(add32(a, q), add32(x, t));
      return add32((a << s) | (a >>> (32 - s)), b);
    }
    function ff(a, b, c, d, x, s, t) {
      return cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    function gg(a, b, c, d, x, s, t) {
      return cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    function hh(a, b, c, d, x, s, t) {
      return cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function ii(a, b, c, d, x, s, t) {
      return cmn(c ^ (b | ~d), a, b, x, s, t);
    }
    function md51(s) {
      const txt = [];
      const n = s.length;
      const state = [1732584193, -271733879, -1732584194, 271733878];
      let i;
      for (i = 64; i <= s.length; i += 64) {
        md5cycle(state, md5blk(s.subarray(i - 64, i)));
      }
      const tail = new Uint8Array(64);
      tail.set(s.subarray(i - 64));
      tail[n - (i - 64)] = 0x80;
      if (n - (i - 64) < 56) {
        md5cycle(state, md5blk(tail));
        tail.fill(0);
      }
      const bits = n * 8;
      tail[56] = bits & 0xff;
      tail[57] = (bits >>> 8) & 0xff;
      tail[58] = (bits >>> 16) & 0xff;
      tail[59] = (bits >>> 24) & 0xff;
      md5cycle(state, md5blk(tail));
      return state;
    }
    function md5blk(s) {
      const md5blks = [];
      for (let i = 0; i < 64; i += 4) {
        md5blks[i >> 2] =
          s[i] + (s[i + 1] << 8) + (s[i + 2] << 16) + (s[i + 3] << 24);
      }
      return md5blks;
    }
    function md5cycle(x, k) {
      let [a, b, c, d] = x;
      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17, 606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12, 1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22, 1236535329);
      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14, 643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9, 38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14, 1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);
      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16, 1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11, 1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487);
      d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16, 530742520);
      b = hh(b, c, d, a, k[2], 23, -995338651);
      a = ii(a, b, c, d, k[0], 6, -198630844);
      d = ii(d, a, b, c, k[7], 10, 1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905);
      b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6, 1700485571);
      d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523);
      b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6, 1873313359);
      d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380);
      b = ii(b, c, d, a, k[13], 21, 1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070);
      d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15, 718787259);
      b = ii(b, c, d, a, k[9], 21, -343485551);
      x[0] = add32(a, x[0]);
      x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]);
      x[3] = add32(d, x[3]);
    }
    function add32(a, b) {
      return (a + b) & 0xffffffff;
    }
    const bytes = new TextEncoder().encode(text);
    const state = md51(bytes);
    const out = new Uint8Array(16);
    for (let i = 0; i < 4; i++) {
      out[i * 4] = state[i] & 0xff;
      out[i * 4 + 1] = (state[i] >>> 8) & 0xff;
      out[i * 4 + 2] = (state[i] >>> 16) & 0xff;
      out[i * 4 + 3] = (state[i] >>> 24) & 0xff;
    }
    return out;
  }

  function getKeyBuffer(key) {
    return md5Bytes(key);
  }

  function getIv(key) {
    return md5Bytes(key.split("").reverse().join(""));
  }

  async function createMac(ciphertext, key) {
    const keyBytes = new TextEncoder().encode(key);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
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

    const tokenJson = new TextDecoder().decode(base64UrlToBytes(encryptedString));
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
    const iv = getIv(decryptionKey);
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
    const iv = getIv(encryptionKey);
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
    createMac,
    decryptToken,
    encryptToken,
  };
})(typeof window !== "undefined" ? window : globalThis);
