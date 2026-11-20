/**
 * An unsuccessful HTTP response from a JSON GET request.
 *
 * Read `response.status` and `response.headers` rather than the message: a non-JSON reply keeps
 * the older "Invalid response Content-Type" message. The response cannot pass through
 * `structuredClone` or `postMessage`.
 * @public
 */
export class ErrorHttpResponse extends Error {
    /** Marker to detect class: "ErrorHttpResponse" */
    public readonly name: string = "ErrorHttpResponse";

    public constructor(
        message: string,
        /** The failed response. Its body may already have been read. */
        public readonly response: Response,
    ) {
        super(message);
    }
}
