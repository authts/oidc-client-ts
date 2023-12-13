import { base64url, exportJWK, SignJWT } from "jose";
import { get, set } from "idb-keyval";

export class DPoPService {
    public async generateDPoPProof(
        url: string,
        accessToken?: string,
        httpMethod?: string,
        nonce?: string,
    ) : Promise<string> {
        let keyPair: CryptoKeyPair;
        let digestHex;
        let hash: string;

        const payload: Record<string, string> = {
            "jti": window.crypto.randomUUID(),
            "htm": httpMethod ?? "GET",
            "htu": url,
        };

        if (nonce) {
            payload.nonce = nonce;
        }

        try {
            if (accessToken) {
                keyPair = await get("oidc.dpop") as CryptoKeyPair;
                digestHex = await this.digestMessage(accessToken);
                hash = base64url.encode(digestHex);
                payload.ath = hash;
            } else {
                keyPair = await this.generateKeys();
                await set("oidc.dpop", keyPair);
            }
            const publicJwk = await exportJWK(keyPair.publicKey);

            return await new SignJWT(payload).setProtectedHeader({
                "alg": "ES256",
                "typ": "dpop+jwt",
                "jwk": publicJwk,
            }).setIssuedAt().sign(keyPair.privateKey);

        } catch (err) {
            if (err instanceof TypeError) {
                throw new Error(`Could not retrieve dpop keys from storage: ${err.message}`);
            } else {
                throw err;
            }
        }
    }

    protected async digestMessage(message: string) : Promise<Uint8Array> {
        const msgUint8 = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
        return new Uint8Array(hashBuffer);
    }

    protected async generateKeys() : Promise<CryptoKeyPair> {
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
