import sha256 from "crypto-js/sha256";
import Base64 from "crypto-js/enc-base64";

import { Log } from "./Log";

export class CryptoUtils {

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
