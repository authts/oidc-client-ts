import { Log } from "../src";

// While NodeJs 15.4 has an experimental implementation, it is not API compatible with the browser version.
class BroadcastChannelPolyfill {
    public onmessage = null;
    public onmessageerror = null;
    private static _eventTargets: Record<string, EventTarget> = {};

    public constructor(public readonly name: string) {
        if (!(name in BroadcastChannelPolyfill._eventTargets)) {
            BroadcastChannelPolyfill._eventTargets[name] = new EventTarget();
        }
    }

    public close(): void {
        // no-op
    }

    public dispatchEvent(): boolean {
        return true;
    }

    public postMessage(message: unknown): void {
        const messageEvent = new Event("message") as Event & { data : unknown };
        messageEvent.data = message;
        BroadcastChannelPolyfill._eventTargets[this.name].dispatchEvent(messageEvent);
    }

    public addEventListener<K extends keyof BroadcastChannelEventMap>(
        type: K,
        listener: (this: BroadcastChannel, ev: BroadcastChannelEventMap[K]) => unknown,
        options?: boolean | AddEventListenerOptions,
    ): void;
    public addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void {
        BroadcastChannelPolyfill._eventTargets[this.name].addEventListener("message", listener, options);
    }

    public removeEventListener<K extends keyof BroadcastChannelEventMap>(
        type: K,
        listener: (this: BroadcastChannel, ev: BroadcastChannelEventMap[K]) => unknown,
        options?: boolean | EventListenerOptions,
    ): void;
    public removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void {
        BroadcastChannelPolyfill._eventTargets[this.name].removeEventListener("message", listener, options);
    }
}

globalThis.BroadcastChannel = BroadcastChannelPolyfill;

class LockManagerPolyfill {
    private _locks: Set<string> = new Set();

    public async request<T>(
        name: string,
        options: LockOptions | ((lock?: Lock) => Promise<T> | T),
        callback?: (lock?: Lock) => Promise<T> | T,
    ): Promise<T> {
        if (options instanceof Function) {
            callback = options;
            options = {};
        }

        while (this._locks.has(name)) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this._locks.add(name);

        try {
            return await callback!({ name, mode: options.mode ?? "exclusive" });
        } finally {
            this._locks.delete(name);
        }
    }

    public async query(): Promise<LockManagerSnapshot> {
        return await Promise.resolve({
            held: [],
            pending: [],
        });
    }
}

globalThis.navigator.locks = new LockManagerPolyfill();

beforeAll(async () => {
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
