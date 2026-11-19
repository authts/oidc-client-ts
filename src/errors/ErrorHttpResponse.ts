/**
 * An unsuccessful HTTP response from a JSON GET request.
 * @public
 */
export class ErrorHttpResponse extends Error {
    public readonly name = "ErrorHttpResponse";

    public constructor(
        message: string,
        /** The failed response. Its body may already have been read. */
        public readonly response: Response,
    ) {
        super(message);
    }
}
