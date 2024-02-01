import { get, keys, set } from "idb-keyval";

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
            hashedToken = await this.hash("SHA-256", accessToken);
            encodedHash = this.encodeBase64Url(hashedToken);
            payload.ath = encodedHash;
        }

        try {
            const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
            const header = {
                "alg": "ES256",
                "typ": "dpop+jwt",
                "jwk": publicJwk,
            };
            return await this.generateSignedJwt(header, payload, keyPair.privateKey);
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
            return await this.customCalculateJwkThumbprint(publicJwk);
        } catch (err) {
            if (err instanceof TypeError) {
                throw new Error(`Could not retrieve dpop keys from storage: ${err.message}`);
            } else {
                throw err;
            }
        }
    }

    public static async customCalculateJwkThumbprint(jwk: JsonWebKey): Promise<string> {
        let jsonObject: object;
        switch (jwk.kty) {
            case "RSA":
                jsonObject = {
                    "e": jwk.e,
                    "kty": jwk.kty,
                    "n": jwk.n,
                };
                break;
            case "EC":
                jsonObject = {
                    "crv": jwk.crv,
                    "kty": jwk.kty,
                    "x": jwk.x,
                    "y": jwk.y,
                };
                break;
            case "OKP":
                jsonObject = {
                    "crv": jwk.crv,
                    "kty": jwk.kty,
                    "x": jwk.x,
                };
                break;
            case "oct":
                jsonObject = {
                    "crv": jwk.k,
                    "kty": jwk.kty,
                };
                break;
            default:
                throw new Error("Unknown jwk type");
        }
        const utf8encodedAndHashed = await this.hash("SHA-256", JSON.stringify(jsonObject));
        return this.encodeBase64Url(utf8encodedAndHashed);
    }

    public static async generateSignedJwt(header: object, payload: object, privateKey: CryptoKey) : Promise<string> {
        const encodedHeader = this.encodeBase64Url(new TextEncoder().encode(JSON.stringify(header)));
        const encodedPayload = this.encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
        const encodedToken = `${encodedHeader}.${encodedPayload}`;

        const signature = await window.crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" },
            },
            privateKey,
            new TextEncoder().encode(encodedToken),
        );

        const encodedSignature = this.encodeBase64Url(new Uint8Array(signature));
        return `${encodedToken}.${encodedSignature}`;
    }

    public static encodeBase64Url = (input: Uint8Array) => {
        return this.encodeBase64(input).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    };

    public static encodeBase64 = (input: Uint8Array) => {
        const CHUNK_SIZE = 0x8000;
        const arr = [];
        for (let i = 0; i < input.length; i += CHUNK_SIZE) {
            const chunk = input.subarray(i, i + CHUNK_SIZE);
            arr.push(String.fromCharCode.apply(null, Array.from(chunk)));
        }
        return btoa(arr.join(""));
    };

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
