import { Logger } from "./Logger";
import { JwtUtils } from "./JwtUtils";

export interface GenerateDPoPProofOpts {
    url: string;
    accessToken?: string;
    httpMethod?: string;
    keyPair: CryptoKeyPair;
    nonce?: string;
}

const UUID_V4_TEMPLATE = "10000000-1000-4000-8000-100000000000";

const toBase64 = (val: ArrayBuffer): string =>
    btoa([...new Uint8Array(val)]
        .map((chr) => String.fromCharCode(chr))
        .join(""));

/**
 * @internal
 */
export class CryptoUtils {
    private static _randomWord(): number {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        return arr[0];
    }

    /**
     * Generates RFC4122 version 4 guid
     */
    public static generateUUIDv4(): string {
        const uuid = UUID_V4_TEMPLATE.replace(/[018]/g, c =>
            (+c ^ CryptoUtils._randomWord() & 15 >> +c / 4).toString(16),
        );
        return uuid.replace(/-/g, "");
    }

    /**
     * PKCE: Generate a code verifier
     */
    public static generateCodeVerifier(): string {
        return CryptoUtils.generateUUIDv4() + CryptoUtils.generateUUIDv4() + CryptoUtils.generateUUIDv4();
    }

    /**
     * PKCE: Generate a code challenge
     */
    public static async generateCodeChallenge(code_verifier: string): Promise<string> {
        if (!crypto.subtle) {
            throw new Error("Crypto.subtle is available only in secure contexts (HTTPS).");
        }

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(code_verifier);
            const hashed = await crypto.subtle.digest("SHA-256", data);
            return toBase64(hashed).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        }
        catch (err) {
            Logger.error("CryptoUtils.generateCodeChallenge", err);
            throw err;
        }
    }

    /**
     * Generates a base64-encoded string for a basic auth header
     */
    public static generateBasicAuth(client_id: string, client_secret: string): string {
        const encoder = new TextEncoder();
        const data = encoder.encode([client_id, client_secret].join(":"));
        return toBase64(data);
    }

    /**
     * Generates a hash of a string using a given algorithm
     * @param alg
     * @param message
     */
    public static async hash(alg: string, message: string) : Promise<Uint8Array> {
        const msgUint8 = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest(alg, msgUint8);
        return new Uint8Array(hashBuffer);
    }

    /**
     * Generates a base64url encoded string
     */
    public static encodeBase64Url = (input: Uint8Array) => {
        return toBase64(input).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    };

    /**
     * Generates a rfc7638 compliant jwk thumbprint
     * @param jwk
     */
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
        const utf8encodedAndHashed = await CryptoUtils.hash("SHA-256", JSON.stringify(jsonObject));
        return CryptoUtils.encodeBase64Url(utf8encodedAndHashed);
    }

    public static async generateDPoPProof({
        url,
        accessToken,
        httpMethod,
        keyPair,
        nonce,
    }: GenerateDPoPProofOpts): Promise<string> {
        let hashedToken: Uint8Array;
        let encodedHash: string;

        const payload: Record<string, string | number> = {
            "jti": window.crypto.randomUUID(),
            "htm": httpMethod ?? "GET",
            "htu": url,
            "iat": Math.floor(Date.now() / 1000),
        };

        if (accessToken) {
            hashedToken = await CryptoUtils.hash("SHA-256", accessToken);
            encodedHash = CryptoUtils.encodeBase64Url(hashedToken);
            payload.ath = encodedHash;
        }

        if (nonce) {
            payload.nonce = nonce;
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

    public static async generateDPoPJkt(keyPair: CryptoKeyPair) : Promise<string> {
        try {
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

    public static async generateDPoPKeys() : Promise<CryptoKeyPair> {
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
