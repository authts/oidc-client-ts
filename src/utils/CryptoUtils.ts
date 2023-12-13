import { Logger } from "./Logger";

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
}
