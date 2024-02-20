import { CryptoUtils, JwtUtils } from "./utils";
import { IndexedDbCryptoKeyPairStore } from "./IndexedDbCryptoKeyPairStore";

/**
 * Provides an implementation of Demonstrating Proof of Posession as defined in the
 * OAuth2 spec https://datatracker.ietf.org/doc/html/rfc9449.
 */
export class DPoPService {
    public static async generateDPoPProof(
        url: string,
        accessToken?: string,
        httpMethod?: string,
        nonce?: string,
    ) : Promise<string> {
        let hashedToken: Uint8Array;
        let encodedHash: string;

        const payload: Record<string, string | number> = {
            "jti": window.crypto.randomUUID(),
            "htm": httpMethod ?? "GET",
            "htu": url,
            "iat": Math.floor(Date.now() / 1000),
        };

        if (nonce) {
            payload.nonce = nonce;
        }

        const keyPair = await this.loadKeyPair();

        if (accessToken) {
            hashedToken = await CryptoUtils.hash("SHA-256", accessToken);
            encodedHash = CryptoUtils.encodeBase64Url(hashedToken);
            payload.ath = encodedHash;
        }

        try {
            const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
            const header = {
                "alg": "ES256",
                "typ": "dpop+jwt",
                "jwk": {
                    "crv": publicJwk.crv,
                    "kty": publicJwk.kty,
                    "x": publicJwk.x,
                    "y": publicJwk.y,
                },
            };
            return await JwtUtils.generateSignedJwt(header, payload, keyPair.privateKey);
        } catch (err) {
            if (err instanceof TypeError) {
                throw new Error(`Error exporting dpop public key: ${err.message}`);
            } else {
                throw err;
            }
        }
    }

    public static async generateDPoPJkt() : Promise<string> {
        try {
            const keyPair = await this.loadKeyPair();
            const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
            return await CryptoUtils.customCalculateJwkThumbprint(publicJwk);
        } catch (err) {
            if (err instanceof TypeError) {
                throw new Error(`Could not retrieve dpop keys from storage: ${err.message}`);
            } else {
                throw err;
            }
        }
    }

    protected static async loadKeyPair() : Promise<CryptoKeyPair> {
        try {
            const allKeys = await IndexedDbCryptoKeyPairStore.getAllKeys();
            let keyPair: CryptoKeyPair;
            if (!allKeys.includes("oidc.dpop")) {
                keyPair = await this.generateKeys();
                await IndexedDbCryptoKeyPairStore.set("oidc.dpop", keyPair);
            } else {
                keyPair = await IndexedDbCryptoKeyPairStore.get("oidc.dpop") as CryptoKeyPair;
            }
            return keyPair;
        } catch (err) {
            if (err instanceof TypeError) {
                throw new Error(`Could not retrieve dpop keys from storage: ${err.message}`);
            } else {
                throw err;
            }
        }
    }

    protected static async generateKeys() : Promise<CryptoKeyPair> {
        return await window.crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256",
            },
            false,
            ["sign", "verify"],
        );
    }
}
