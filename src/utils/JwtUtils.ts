import { jwtDecode } from "jwt-decode";

import { Logger } from "./Logger";
import type { JwtClaims } from "../Claims";
import { CryptoUtils } from "./CryptoUtils";

/**
 * @internal
 */
export class JwtUtils {
    // IMPORTANT: doesn't validate the token
    public static decode(token: string): JwtClaims {
        try {
            return jwtDecode<JwtClaims>(token);
        }
        catch (err) {
            Logger.error("JwtUtils.decode", err);
            throw err;
        }
    }

    public static async generateSignedJwt(header: object, payload: object, privateKey: CryptoKey) : Promise<string> {
        const encodedHeader = CryptoUtils.encodeBase64Url(new TextEncoder().encode(JSON.stringify(header)));
        const encodedPayload = CryptoUtils.encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
        const encodedToken = `${encodedHeader}.${encodedPayload}`;

        const signature = await window.crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" },
            },
            privateKey,
            new TextEncoder().encode(encodedToken),
        );

        const encodedSignature = CryptoUtils.encodeBase64Url(new Uint8Array(signature));
        return `${encodedToken}.${encodedSignature}`;
    }
}
