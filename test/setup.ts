import { Log } from "../src";

beforeAll(() => {
    globalThis.fetch = jest.fn();

    const location = Object.defineProperties({}, {
        ...Object.getOwnPropertyDescriptors(window.location),
        assign: {
            enumerable: true,
            value: jest.fn(),
        },
        replace: {
            enumerable: true,
            value: jest.fn(),
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
