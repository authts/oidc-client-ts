import { Log } from "../src";
import "fake-indexeddb/auto";
import { beforeAll, beforeEach, vi } from "vitest";

beforeAll(() => {
    globalThis.fetch = vi.fn();

    const pageshow = () => window.dispatchEvent(new Event("pageshow"));

    const location = Object.defineProperties({}, {
        ...Object.getOwnPropertyDescriptors(window.location),
        assign: {
            enumerable: true,
            value: vi.fn(pageshow),
        },
        replace: {
            enumerable: true,
            value: vi.fn(pageshow),
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
