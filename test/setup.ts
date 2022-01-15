import { Log } from "../src";

beforeAll(() => {
    globalThis.fetch = jest.fn();

    const unload = () => window.dispatchEvent(new Event("beforeunload"));

    const location = Object.defineProperties({}, {
        ...Object.getOwnPropertyDescriptors(window.location),
        assign: {
            enumerable: true,
            value: jest.fn(unload),
        },
        replace: {
            enumerable: true,
            value: jest.fn(unload),
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
