import { Log } from "../src";
import "fake-indexeddb/auto";
import { TextEncoder } from "util";
import { webcrypto } from "node:crypto";

beforeAll(() => {
    globalThis.TextEncoder = TextEncoder;
    Object.assign(globalThis.crypto, {
        subtle: webcrypto.subtle,
    });
    globalThis.fetch = jest.fn();

    const pageshow = () => window.dispatchEvent(new Event("pageshow"));

    const location = Object.defineProperties({}, {
        ...Object.getOwnPropertyDescriptors(window.location),
        assign: {
            enumerable: true,
            value: jest.fn(pageshow),
        },
        replace: {
            enumerable: true,
            value: jest.fn(pageshow),
        },
    });
    Object.defineProperty(window, "location", {
        enumerable: true,
        get: () => location,
    });
});

beforeEach(() => {
    Log.setLevel(Log.NONE);
    Log.setLogger(console);
});
