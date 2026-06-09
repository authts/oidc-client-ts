export class ErrorDPoPNonce extends Error {
    /** Marker to detect class: "ErrorDPoPNonce" */
    public readonly name: string = "ErrorDPoPNonce";
    public readonly nonce: string;

    public constructor(nonce: string, message?: string) {
        super(message);
        this.nonce = nonce;
    }
}
