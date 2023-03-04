import { Log } from "../src";
import { TextEncoder } from "util";
import { webcrypto } from "node:crypto";

beforeAll(() => {
    globalThis.TextEncoder = TextEncoder;
    Object.assign(globalThis.crypto, {
        subtle: webcrypto.subtle,
    });
    globalThis.fetch = jest.fn();

    const unload = () =>
        setTimeout(() => window.dispatchEvent(new Event("unload")), 200);

    const location = Object.defineProperties(
        {},
        {
            ...Object.getOwnPropertyDescriptors(window.location),
            assign: {
                enumerable: true,
                value: jest.fn(unload),
            },
            replace: {
                enumerable: true,
                value: jest.fn(unload),
            },
        },
    );
    Object.defineProperty(window, "location", {
        enumerable: true,
        get: () => location,
    });
});

beforeEach(() => {
    Log.setLevel(Log.NONE);
    Log.setLogger(console);
});
