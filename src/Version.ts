// @ts-expect-error avoid enabling resolveJsonModule to keep build process simple
import { version } from "../package.json";

/**
 * @public
 */
export const Version: string = version;
