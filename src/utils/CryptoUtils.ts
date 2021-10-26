import sha256 from "crypto-js/sha256";
import Base64 from "crypto-js/enc-base64";

import { Log } from "./Log";

const UUID_V4_TEMPLATE = "10000000-1000-4000-8000-100000000000";

export class CryptoUtils {

    private static _cryptoUUIDv4(): string {
        return UUID_V4_TEMPLATE.replace(/[018]/g, c =>
            (+c ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
    }

    private static  _UUIDv4(): string {
        return UUID_V4_TEMPLATE.replace(/[018]/g, c =>
            (+c ^ Math.random() * 16 >> +c / 4).toString(16)
        );
    }

    /**
     * Generates RFC4122 version 4 guid
     */
    public static  generateUUIDv4(): string {
        const hasRandomValues = window.crypto && Object.prototype.hasOwnProperty.call(window.crypto, "getRandomValues");
        const uuid = hasRandomValues ? CryptoUtils._cryptoUUIDv4() : CryptoUtils._UUIDv4();
        return uuid.replace(/-/g, "");
    }

    /**
     * PKCE: Generate a code verifier
     * @return {string}
     */
    public static generateCodeVerifier(): string {
        return CryptoUtils.generateUUIDv4() + CryptoUtils.generateUUIDv4() + CryptoUtils.generateUUIDv4();
    }

    /**
     * PKCE: Generate a code challenge
     * @return {string}
     */
    public static generateCodeChallenge(code_verifier: string): string {
        try {
            const hashed = sha256(code_verifier);
            return Base64.stringify(hashed).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        }
        catch (err) {
            Log.error(err);
            throw err;
        }
    }
}
