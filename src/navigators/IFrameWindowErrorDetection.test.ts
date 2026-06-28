import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IFrameWindow } from "./IFrameWindow";
import { ErrorResponse } from "../errors";

describe("IFrameWindow error detection", () => {
    let iframeMock: HTMLIFrameElement;
    let contentWindowMock: WindowProxy;
    const listeners: Map<string, EventListener> = new Map();
    const postMessageMock = vi.fn();

    beforeEach(() => {
        listeners.clear();
        contentWindowMock = {
            location: {
                href: "",
                replace: vi.fn(),
            },
        } as unknown as WindowProxy;

        iframeMock = {
            contentWindow: contentWindowMock,
            style: {},
            setAttribute: vi.fn(),
            addEventListener: vi.fn((event: string, listener: EventListener) => {
                listeners.set(event, listener);
            }),
            removeEventListener: vi.fn((event: string) => {
                listeners.delete(event);
            }),
            parentNode: { removeChild: vi.fn() },
        } as unknown as HTMLIFrameElement;

        vi.spyOn(window.document, "createElement").mockReturnValue(iframeMock);
        vi.spyOn(window.document.body, "appendChild").mockImplementation(() => iframeMock);
        vi.spyOn(window, "addEventListener").mockImplementation(() => {});
        vi.spyOn(window, "parent", "get").mockReturnValue({
            postMessage: postMessageMock,
        } as unknown as WindowProxy);
        Object.defineProperty(window, "location", {
            enumerable: true,
            value: { origin: "https://fake-origin.com" },
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should throw ErrorResponse when iframe URL contains error=login_required", async () => {
        const frameWindow = new IFrameWindow({});
        const navigatePromise = frameWindow.navigate({ state: "test-state", url: "https://fakeurl.com" });

        // Simulate iframe load with error URL
        Object.defineProperty(contentWindowMock.location, "href", {
            value: "https://fakeurl.com?error=login_required&error_description=authentication+required",
        });
        const loadHandler = listeners.get("load");
        expect(loadHandler).toBeDefined();
        loadHandler!({} as Event);

        await expect(navigatePromise).rejects.toThrow(ErrorResponse);
        await expect(navigatePromise).rejects.toMatchObject({
            error: "login_required",
            error_description: "authentication required",
        });
    });

    it("should throw ErrorResponse with correct error when iframe URL contains error=consent_required", async () => {
        const frameWindow = new IFrameWindow({});
        const navigatePromise = frameWindow.navigate({ state: "test-state", url: "https://fakeurl.com" });

        // Simulate iframe load with consent_required error
        Object.defineProperty(contentWindowMock.location, "href", {
            value: "https://fakeurl.com?error=consent_required&error_description=user+consent+required",
        });
        const loadHandler = listeners.get("load");
        loadHandler!({} as Event);

        await expect(navigatePromise).rejects.toThrow(ErrorResponse);
        await expect(navigatePromise).rejects.toMatchObject({
            error: "consent_required",
        });
    });

    it("should throw ErrorResponse with error as description when error_description is missing", async () => {
        const frameWindow = new IFrameWindow({});
        const navigatePromise = frameWindow.navigate({ state: "test-state", url: "https://fakeurl.com" });

        // Simulate iframe load with error but no description
        Object.defineProperty(contentWindowMock.location, "href", {
            value: "https://fakeurl.com?error=interaction_required",
        });
        const loadHandler = listeners.get("load");
        loadHandler!({} as Event);

        await expect(navigatePromise).rejects.toThrow(ErrorResponse);
        await expect(navigatePromise).rejects.toMatchObject({
            error: "interaction_required",
            error_description: "interaction_required",
        });
    });

    it("should clear timeout and throw when error detected before timeout fires", async () => {
        const frameWindow = new IFrameWindow({ silentRequestTimeoutInSeconds: 10 });
        const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

        const navigatePromise = frameWindow.navigate({ state: "test-state", url: "https://fakeurl.com" });

        // Simulate iframe load with error URL
        Object.defineProperty(contentWindowMock.location, "href", {
            value: "https://fakeurl.com?error=login_required",
        });
        const loadHandler = listeners.get("load");
        loadHandler!({} as Event);

        await expect(navigatePromise).rejects.toThrow();
        // Verify clearTimeout was called (timer was cleared)
        expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should handle cross-origin access error gracefully when checking iframe URL", async () => {
        const frameWindow = new IFrameWindow({});
        // Make contentWindow.location.href throw when accessed
        Object.defineProperty(contentWindowMock.location, "href", {
            get: () => { throw new Error("SecurityError: Blocked a frame with origin"); },
        });

        const navigatePromise = frameWindow.navigate({ state: "test-state", url: "https://fakeurl.com" });

        // Simulate iframe load - should not throw even though we can't access URL
        const loadHandler = listeners.get("load");
        expect(() => loadHandler!({} as Event)).not.toThrow();

        // Promise should still be pending (waiting for message or timeout)
        const race = Promise.race([
            navigatePromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 50)),
        ]);
        await expect(race).rejects.toThrow("timeout");
    });

    it("should remove load listener on cleanup", async () => {
        const frameWindow = new IFrameWindow({});
        const navigatePromise = frameWindow.navigate({ state: "test-state", url: "https://fakeurl.com" });

        // Trigger cleanup by resolving via message
        Object.defineProperty(contentWindowMock.location, "href", {
            value: "https://fakeurl.com?code=validcode&state=test-state",
        });
        const loadHandler = listeners.get("load");
        loadHandler!({} as Event);

        // Simulate successful postMessage resolution
        const messageHandler = (window.addEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
            (call) => call[0] === "message",
        )?.[1] as (e: MessageEvent) => void;

        if (messageHandler) {
            messageHandler({
                data: { source: "oidc-client", url: "https://fakeurl.com?code=validcode&state=test-state" },
                origin: "https://fake-origin.com",
                source: contentWindowMock,
            } as MessageEvent);
        }

        await navigatePromise;

        // Verify removeEventListener was called for the load handler
        expect(iframeMock.removeEventListener).toHaveBeenCalledWith("load", expect.any(Function));
    });
});
