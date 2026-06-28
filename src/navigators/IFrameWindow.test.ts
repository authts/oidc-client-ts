import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { IFrameWindow } from "./IFrameWindow";
import type { NavigateParams } from "./IWindow";
import { ErrorResponse } from "../errors";

const flushPromises = () => new Promise(process.nextTick);

class AbortableIFrameWindow extends IFrameWindow {
    public abort(): void {
        void this._abort.raise(new Error("test aborted"));
    }
}

describe("IFrameWindow", () => {
    const postMessageMock = vi.fn();
    const fakeWindowOrigin = "https://fake-origin.com";
    const fakeUrl = "https://fakeurl.com";

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("hidden frame", () => {
        let frameWindow: IFrameWindow;

        beforeAll(() => {
            frameWindow = new IFrameWindow({ });
        });

        it("should have appropriate styles for hidden presentation", () => {
            const { visibility, position, left, top } = frameWindow["_frame"]!.style;

            expect(visibility).toBe("hidden");
            expect(position).toBe("fixed");
            expect(left).toBe("-1000px");
            expect(top).toBe("0px");
        });

        it("should have 0 width and height", () => {
            const { width, height } = frameWindow["_frame"]!;
            expect(width).toBe("0");
            expect(height).toBe("0");
        });
    });

    describe("attributes", () => {
        let frameWindow: IFrameWindow;

        beforeAll(() => {
            frameWindow = new IFrameWindow({ iframeAttributes: { "allow": "local-network-access *", "another_attr": "another_value" } });
        });

        it("should have custom attributes", () => {
            const allow = frameWindow["_frame"]!.getAttribute("allow");
            const anotherAttr = frameWindow["_frame"]!.getAttribute("another_attr");
            expect(allow).toBe("local-network-access *");
            expect(anotherAttr).toBe("another_value");
        });
    });

    describe("close", () => {
        let subject: IFrameWindow;
        const parentRemoveChild = vi.fn();
        beforeEach(() => {
            subject = new IFrameWindow({});
            vi.spyOn(subject["_frame"]!, "parentNode", "get").mockReturnValue({
                removeChild: parentRemoveChild,
            } as unknown as ParentNode);
        });

        it("should reset window to null", () => {
            subject.close();
            expect(subject["_window"]).toBeNull();
        });

        describe("if frame defined", () => {
            it("should set blank url for contentWindow", () => {
                const replaceMock = vi.fn();
                vi.spyOn(subject["_frame"]!, "contentWindow", "get")
                    .mockReturnValue({ location: { replace: replaceMock } } as unknown as WindowProxy);

                subject.close();
                expect(replaceMock).toHaveBeenCalledWith("about:blank");
            });

            it("should reset frame to null", () => {
                subject.close();
                expect(subject["_frame"]).toBeNull();
            });
        });
    });

    describe("navigate", () => {
        const contentWindowMock = vi.fn();

        beforeAll(() => {
            vi.spyOn(window, "parent", "get").mockReturnValue({
                postMessage: postMessageMock,
            } as unknown as WindowProxy);
            Object.defineProperty(window, "location", {
                enumerable: true,
                value: { origin: fakeWindowOrigin },
            });

            contentWindowMock.mockReturnValue(null);
            vi.spyOn(window.document.body, "appendChild").mockImplementation((child) => child);
            vi.spyOn(window.document, "createElement").mockImplementation(() => ({
                contentWindow: contentWindowMock(),
                style: {},
                setAttribute: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            } as unknown as HTMLIFrameElement),
            );
        });

        it("when frame.contentWindow is not defined should throw error", async() => {
            const frameWindow = new IFrameWindow({});
            await expect(frameWindow.navigate({} as NavigateParams))
                .rejects
                .toMatchObject({ message: "Attempted to navigate on a disposed window" });
        });

        describe("when message received", () => {
            const fakeState = "fffaaakkkeee_state";
            const fakeContentWindow = { location: { replace: vi.fn() } };
            const validNavigateParams = {
                source: fakeContentWindow,
                data: { source: "oidc-client",
                    url: `https://test.com?state=${fakeState}` },
                origin: fakeWindowOrigin,
            };
            const navigateParamsStub = vi.fn();

            beforeAll(() => {
                contentWindowMock.mockReturnValue(fakeContentWindow);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                vi.spyOn(window, "addEventListener").mockImplementation((_, listener: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    setTimeout(() => { listener(navigateParamsStub()); });
                });
            });

            it.each([
                ["https://custom-origin.com", "https://custom-origin.com" ],
                [ fakeWindowOrigin, undefined],
            ])("and all parameters match should resolve navigation without issues", async (origin, scriptOrigin) => {
                navigateParamsStub.mockReturnValue({ ...validNavigateParams, origin });
                const frameWindow = new IFrameWindow({});
                await expect(frameWindow.navigate({ state: fakeState, url: fakeUrl, scriptOrigin })).resolves.not.toThrow();
            });

            it.each([
                { passedOrigin: undefined, type: "window origin" },
                { passedOrigin: "https://custom-origin.com", type: "passed script origi" },
            ])("and message origin does not match $type should never resolve", async (args) => {
                let promiseDone = false;
                navigateParamsStub.mockReturnValue({ ...validNavigateParams, origin: "http://different.com" });

                const frameWindow = new AbortableIFrameWindow({});
                const promise = frameWindow.navigate({ state: fakeState, url: fakeUrl, scriptOrigin: args.passedOrigin });

                void promise.catch(() => {}).finally(() => promiseDone = true);
                await flushPromises();

                expect(promiseDone).toBe(false);
                frameWindow.abort();
            });

            it("and data url parse fails should reject with error", async () => {
                navigateParamsStub.mockReturnValue({ ...validNavigateParams, data: { ...validNavigateParams.data, url: undefined } });
                const frameWindow = new IFrameWindow({});
                await expect(frameWindow.navigate({ state: fakeState, url: fakeUrl })).rejects.toThrow("Invalid response from window");
            });

            it("and args source with state do not match contentWindow should never resolve", async () => {
                let promiseDone = false;
                navigateParamsStub.mockReturnValue({ ...validNavigateParams, source: {} });

                const frameWindow = new AbortableIFrameWindow({});
                const promise = frameWindow.navigate({ state: "diff_state", url: fakeUrl });

                void promise.catch(() => {}).finally(() => promiseDone = true);
                await flushPromises();

                expect(promiseDone).toBe(false);
                frameWindow.abort();
            });
        });
    });

    describe("navigate with error detection", () => {
        let iframeMock: HTMLIFrameElement;
        let contentWindowMock: WindowProxy;
        const listeners: Map<string, EventListener> = new Map();

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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                removeEventListener: vi.fn((event: string, _listener: EventListener) => {
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
                value: { origin: fakeWindowOrigin },
            });
        });

        it("should throw ErrorResponse when iframe URL contains error=login_required", async () => {
            const frameWindow = new IFrameWindow({});
            const navigatePromise = frameWindow.navigate({ state: "test-state", url: fakeUrl });

            // Simulate iframe load with error URL
            Object.defineProperty(contentWindowMock.location, "href", {
                value: `${fakeUrl}?error=login_required&error_description=authentication+required`,
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
            const navigatePromise = frameWindow.navigate({ state: "test-state", url: fakeUrl });

            // Simulate iframe load with consent_required error
            Object.defineProperty(contentWindowMock.location, "href", {
                value: `${fakeUrl}?error=consent_required&error_description=user+consent+required`,
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
            const navigatePromise = frameWindow.navigate({ state: "test-state", url: fakeUrl });

            // Simulate iframe load with error but no description
            Object.defineProperty(contentWindowMock.location, "href", {
                value: `${fakeUrl}?error=interaction_required`,
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

            const navigatePromise = frameWindow.navigate({ state: "test-state", url: fakeUrl });

            // Simulate iframe load with error URL
            Object.defineProperty(contentWindowMock.location, "href", {
                value: `${fakeUrl}?error=login_required`,
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

            const navigatePromise = frameWindow.navigate({ state: "test-state", url: fakeUrl });

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
            const navigatePromise = frameWindow.navigate({ state: "test-state", url: fakeUrl });

            // Trigger cleanup by resolving via message
            Object.defineProperty(contentWindowMock.location, "href", {
                value: `${fakeUrl}?code=validcode&state=test-state`,
            });
            const loadHandler = listeners.get("load");
            loadHandler!({} as Event);

            // Simulate successful postMessage resolution
            const messageHandler = (window.addEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
                (call) => call[0] === "message",
            )?.[1] as (e: MessageEvent) => void;

            if (messageHandler) {
                messageHandler({
                    data: { source: "oidc-client", url: `${fakeUrl}?code=validcode&state=test-state` },
                    origin: fakeWindowOrigin,
                    source: contentWindowMock,
                } as MessageEvent);
            }

            await navigatePromise;

            // Verify removeEventListener was called for the load handler
            expect(iframeMock.removeEventListener).toHaveBeenCalledWith("load", expect.any(Function));
        });
    });

    describe("notifyParent", () => {
        const messageData = {
            source: "oidc-client",
            url: fakeUrl,
            keepOpen: false,
        };

        it.each([
            ["https://parent-domain.com", "https://parent-domain.com"],
            [undefined, fakeWindowOrigin],
        ])("should call postMessage with appropriate parameters", (targetOrigin, expectedOrigin) => {
            IFrameWindow.notifyParent(messageData.url, targetOrigin);
            expect(postMessageMock).toHaveBeenCalledWith(messageData, expectedOrigin);
        });
    });
});
