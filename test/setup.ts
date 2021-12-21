import { Log } from "../src";

beforeAll(() => {
    globalThis.fetch = jest.fn();
});

beforeEach(() => {
    Log.setLevel(Log.NONE);
    Log.setLogger(console);
});
