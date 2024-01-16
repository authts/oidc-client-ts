import { base64url, exportJWK, SignJWT, calculateJwkThumbprint } from "jose";
import { get, set, keys } from "idb-keyval";

export class DPoPService {
    public static async generateDPoPProof(
        url: string,
        accessToken?: string,
        httpMethod?: string,
        nonce?: string,
    ) : Promise<string> {
        let hashedToken: Uint8Array;
        let encodedHash: string;

        const payload: Record<string, string> = {
            "jti": window.crypto.randomUUID(),
            "htm": httpMethod ?? "GET",
            "htu": url,
        };

        if (nonce) {
            payload.nonce = nonce;
        }

        const keyPair = await this.loadKeyPair();

        if (accessToken) {
            hashedToken = await this.hash("SHA-256", accessToken);
            encodedHash = base64url.encode(hashedToken);
            payload.ath = encodedHash;
        }

        try {
            const publicJwk = await exportJWK(keyPair.publicKey);
            return await new SignJWT(payload).setProtectedHeader({
                "alg": "ES256",
                "typ": "dpop+jwt",
                "jwk": publicJwk,
            }).setIssuedAt().sign(keyPair.privateKey);
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
            const publicJwk = await exportJWK(keyPair.publicKey);
            return await calculateJwkThumbprint(publicJwk, "sha256");
        } catch (err) {
            if (err instanceof TypeError) {
                throw new Error(`Could not retrieve dpop keys from storage: ${err.message}`);
            } else {
                throw err;
            }
        }
    }

    protected static async hash(alg: string, message: string) : Promise<Uint8Array> {
        const msgUint8 = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest(alg, msgUint8);
        return new Uint8Array(hashBuffer);
    }

    protected static async loadKeyPair() : Promise<CryptoKeyPair> {
        try {
            const allKeys = await keys();
            let keyPair: CryptoKeyPair;
            if (!allKeys.includes("oidc.dpop")) {
                keyPair = await this.generateKeys();
                await set("oidc.dpop", keyPair);
            } else {
                keyPair = await get("oidc.dpop") as CryptoKeyPair;
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
