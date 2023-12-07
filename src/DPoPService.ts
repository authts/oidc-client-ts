import { SignJWT, base64url, exportJWK } from "jose";
import { set, get } from "idb-keyval";

export class DPoPService {
    public async generateDPoPProof(url: string, accessToken?: string, httpMethod?: string) : Promise<string> {
        let keyPair: CryptoKeyPair;
        let digestHex;
        let hash: string;

        const payload: Record<string, string> = {
            "jti": window.crypto.randomUUID(),
            "htm": httpMethod ?? "GET",
            "htu": url,
        };

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

        const dpopProofJwt = await new SignJWT(payload).setProtectedHeader({
            "alg": "ES256",
            "typ": "dpop+jwt",
            "jwk": publicJwk,
        }).setIssuedAt().sign(keyPair.privateKey);

        console.log("DPoP proof token for requesting access token: ", dpopProofJwt);
        return dpopProofJwt;
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
