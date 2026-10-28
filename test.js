const crypto = require('crypto');
const zlib = require('zlib');

const VERSION = 1;
const ALGORITHM = 'aes-128-cbc';

function decryptGameDataRoute(req, res) {
    try {
        decryptGameData("eyJ2IjoxLCJjdCI6IlQzUXdkdFlVZWhfWVlYOTNpaU1iTTdiNlRRMVZzRXFUMC04Y1B1T0FvM1RsODYzaUVyOWhMZ1dXYTZaQzFLUDlkOEJZazdvWm9DT0h3MEMzMmZVdWNRNEt6ellfNlQ1UkxKUUw4Z2dnQlpENUJNRFRfbmtncmowTjZzWG9zdlY4Z3c1THp0SGdGTHZtSVk5ZkktWFRLaDRVcFplUmV4ZVBuNDVubUJQbkxuQm8zYXZBNmpHWUNzOFlqdVZBU3c2SEE3a1NKd2FISXFKTHRhNW1DSFFqUzZsOEFyY1NoNGEwYnBnbURlb19ISTl1ZHdxV1c5c2dpYWNNN2FZZEJGcktaeHBEQjVaaXBVY3BmQlp5V3Z5VVY2dFVDZERDNVBiRlpSQTVFUFF0WkxNaFNrSkZOUFExN1dETzNFTEc4ZFpVaGt0U3FLMjVzMng2QmZlM09OV01BWU1NX05LTW11UlJmX2JhRTJBU0gwS3BPT3VkU2d5bEstYzN5VVpBdnplUGswRmRXZ3RZck05dEpmNmlPRUtzbzNfN190dDZSVHRscU1WbU1EdE5WTTdsZ3I3YWhnaVFLVXFmVU40RFVGNzgzZ0c4RjFDbUI0c1U2T1VKbV9uaF9IYnJkWmdZZFhtYk80NGgxWlRES05ta1o4MjZZOFVFMER1QnEwdjNPc3Z6YUcydUozOGlBd01aUV82alN3WmlYMk1zYksyZl92d0ptT1R0VFNuenRrU2E1MXJLUUppV1BjLVhNWDZsdVJvTTdhUGtCbC1feVBXcnhNV19JQk9ud0xyX253T0VmaG10Y3VOSXRHSTZJZFNUY1Y0SUw1T3BCaVk3UVNIMDd0T1RPcG1RSW4ydnhxZXpGLTVRaE50RktsOG9qX3dWd1d4SlNwS2dneTg0cWt1RXUyRUhkOXppY2NOVW1VdlZpR3QtNDVhcF95OWd0cHZWVVVULXpVNDBIeHh0ZElKRWdLQXotSmlIZGR6cXRyMCIsIm1hYyI6ImkwQ0JHRThmZG5WYWVGc0ZEUEdUYnNTRUJ5NjlIWVkxX0hXUWNEZ3Q0aGMifQ", "J9k8L7m6N5p4Q3r2");
    } catch (error) {
        console.error('Error decrypting game data:', error);
    }
};

function decryptGameData(encryptedString, decryptionKey) {
    try {
        const payload = decryptToken(encryptedString, decryptionKey, 'encryptedString');
        assertNonExpiringGameDataPayload(payload, 'encryptedString');
        return payload.data;
    } catch (error) {
        if (error instanceof GameDataCryptoError) throw error;
        throw new GameDataCryptoError('TOKEN_TAMPERED', 'encryptedString is invalid or has been tampered with');
    }
}

function decryptToken(encryptedString, decryptionKey, tokenName) {
    if (!encryptedString) {
        throw new GameDataCryptoError('INVALID_TOKEN', `${tokenName} is required`, {
            tokenName,
            failurePoint: 'TOKEN_MISSING',
        });
    }
    if (typeof encryptedString !== 'string') {
        throw new GameDataCryptoError('INVALID_TOKEN', `${tokenName} must be a string`, {
            tokenName,
            failurePoint: 'TOKEN_TYPE_INVALID',
            actualType: typeof encryptedString,
        });
    }
    if (!decryptionKey) {
        throw new GameDataCryptoError('INVALID_DECRYPTION_KEY', 'decryptionKey is required', {
            tokenName,
            failurePoint: 'DECRYPTION_KEY_MISSING',
        });
    }

    const normalizedEncryptedString = encryptedString.trim();
    let token;
    try {
        token = JSON.parse(
            base64UrlDecode(normalizedEncryptedString, 'TOKEN_BASE64_DECODE_FAILED').toString('utf8')
        );
    } catch (error) {
        if (error instanceof GameDataCryptoError) {
            error.details = withTokenDetails(tokenName, decryptionKey, error.details);
            throw error;
        }
        throw new GameDataCryptoError('INVALID_TOKEN', `${tokenName} JSON parsing failed`, withTokenDetails(tokenName, decryptionKey, {
            failurePoint: 'TOKEN_JSON_PARSE_FAILED',
            error: error.message,
            tokenLength: normalizedEncryptedString.length,
        }));
    }

    if (token?.v !== VERSION || !token.ct || !token.mac) {
        throw new GameDataCryptoError('INVALID_TOKEN', `${tokenName} structure is invalid`, withTokenDetails(tokenName, decryptionKey, {
            failurePoint: 'TOKEN_STRUCTURE_INVALID',
            tokenVersion: token?.v,
            hasCiphertext: Boolean(token?.ct),
            hasMac: Boolean(token?.mac),
        }));
    }

    let encrypted;
    try {
        encrypted = base64UrlDecode(token.ct, 'CIPHERTEXT_BASE64_DECODE_FAILED');
    } catch (error) {
        if (error instanceof GameDataCryptoError) {
            error.details = withTokenDetails(tokenName, decryptionKey, error.details);
            throw error;
        }
        throw error;
    }

    let actualMac;
    try {
        actualMac = base64UrlDecode(token.mac, 'HMAC_BASE64_DECODE_FAILED');
    } catch (error) {
        if (error instanceof GameDataCryptoError) {
            error.details = withTokenDetails(tokenName, decryptionKey, error.details);
            throw error;
        }
        throw error;
    }

    const expectedMac = createMac(encrypted, decryptionKey);
    if (!timingSafeEqual(expectedMac, actualMac)) {
        throw new GameDataCryptoError('TOKEN_TAMPERED', `${tokenName} HMAC validation failed`, withTokenDetails(tokenName, decryptionKey, {
            failurePoint: 'HMAC_VALIDATION_FAILED',
            probableCause: 'Token was modified/corrupted, or the score decryption key/config differs from the one used to generate it.',
            tokenLength: normalizedEncryptedString.length,
            ciphertextLength: encrypted.length,
            hmacLength: actualMac.length,
        }));
    }

    let compressed;
    try {
        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            getKeyBuffer(decryptionKey, 'decryptionKey'),
            getIv(decryptionKey)
        );
        compressed = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch (error) {
        throw new GameDataCryptoError('TOKEN_DECRYPT_FAILED', `${tokenName} AES decryption failed`, withTokenDetails(tokenName, decryptionKey, {
            failurePoint: 'AES_DECRYPTION_FAILED',
            error: error.message,
            probableCause: 'Crypto configuration or ciphertext is invalid.',
        }));
    }

    let jsonPayload;
    try {
        jsonPayload = zlib.inflateRawSync(compressed).toString('utf8');
    } catch (error) {
        throw new GameDataCryptoError('TOKEN_DECOMPRESS_FAILED', `${tokenName} decompression failed`, withTokenDetails(tokenName, decryptionKey, {
            failurePoint: 'DECOMPRESSION_FAILED',
            error: error.message,
            probableCause: 'Decrypted payload is not valid deflateRaw data.',
        }));
    }

    try {
        console.log('Decrypted JSON payload:', JSON.parse(jsonPayload));
        return JSON.parse(jsonPayload);
    } catch (error) {
        throw new GameDataCryptoError('INVALID_TOKEN', `${tokenName} payload JSON parsing failed`, withTokenDetails(tokenName, decryptionKey, {
            failurePoint: 'PAYLOAD_JSON_PARSE_FAILED',
            error: error.message,
        }));
    }
}

function assertNonExpiringGameDataPayload(payload, tokenName) {
    // Game data encrypted strings are intentionally non-expiring.
    // Older payloads may still contain iat/exp, but game data decryption must
    // ignore those fields so valid encrypted strings remain usable unless the key changes.
    if (payload?.v !== VERSION || !payload.data) {
        throw new GameDataCryptoError('INVALID_TOKEN', `${tokenName} payload is invalid`);
    }
}

function base64UrlDecode(value, failurePoint = 'BASE64_DECODE_FAILED') {
    if (!value || typeof value !== 'string') {
        throw new GameDataCryptoError('INVALID_TOKEN', 'encryptedString is required');
    }

    const normalizedValue = value.trim();
    if (!/^[A-Za-z0-9_-]+$/.test(normalizedValue)) {
        throw new GameDataCryptoError('INVALID_TOKEN', 'encryptedString is not valid URL-safe base64', {
            failurePoint,
            tokenLength: value.length,
        });
    }

    try {
        const normalized = normalizedValue.replace(/-/g, '+').replace(/_/g, '/');
        return Buffer.from(normalized + '='.repeat((4 - normalized.length % 4) % 4), 'base64');
    } catch (error) {
        throw new GameDataCryptoError('INVALID_TOKEN', 'encryptedString base64 decoding failed', {
            failurePoint,
            error: error.message,
            tokenLength: value.length,
        });
    }
}

function getMacKey(decryptionKey) {
    return crypto.createHash('sha256').update(`mac:${decryptionKey}`).digest();
}

function createMac(ciphertext, decryptionKey) {
    return crypto.createHmac('sha256', getMacKey(decryptionKey)).update(ciphertext).digest();
}

function timingSafeEqual(left, right) {
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function getIv(decryptionKey) {
    return crypto.createHash('sha256').update(`iv:${decryptionKey}`).digest().subarray(0, 16);
}

function getKeyBuffer(value, label) {
    const key = Buffer.from(String(value || ''), 'utf8');
    if (key.length > 16) {
        throw new GameDataCryptoError('INVALID_CONFIG', `${label} must be 16 characters or fewer`);
    }

    return Buffer.concat([key, Buffer.alloc(16)]).subarray(0, 16);
}

class GameDataCryptoError extends Error {
    constructor(code, message, details = {}) {
        super(message);
        this.name = 'GameDataCryptoError';
        this.code = code;
        this.details = details;
    }
}

const gameData = decryptGameDataRoute();

// In the console we are getting the required object which will be used for further score submission process. 