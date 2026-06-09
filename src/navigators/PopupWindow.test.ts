import { PopupWindow } from "./PopupWindow";
import { Log } from "../utils";
import { setImmediate } from "timers";
import { expect, describe, beforeEach, vi, afterEach, it } from "vitest";

function firstSuccessfulResult<T>(fn: () => T): T {
    expect(fn).toHaveReturned();
    return vi.mocked(fn).mock.results[0].value as T;
}

function definePopupWindowClosedProperty(closed: boolean) {
    const popupFromWindowOpen = firstSuccessfulResult(window.open);
    Object.defineProperty(popupFromWindowOpen, "closed", {
        enumerable: true,
        value: closed,
    });
}

describe("PopupWindow", () => {
    beforeEach(() => {
        Object.defineProperty(window, "location", {
            enumerable: true,
            value: { origin: "http://app" },
        });
        Object.defineProperty(window, "history", {
            enumerable: true,
            value: {},
        });
        Object.defineProperty(window, "localStorage", {
            enumerable: true,
            value: {},
        });
        Object.defineProperty(window, "sessionStorage", {
            enumerable: true,
            value: {},
        });

        window.opener = {
            postMessage: vi.fn(),
        };
        window.open = vi.fn(() => ({
            location: { replace: vi.fn() },
            history: { replace: vi.fn() },
            localStorage: { replace: vi.fn() },
            sessionStorage: { replace: vi.fn() },
            focus: vi.fn(),
            close: vi.fn(),
        } as unknown as WindowProxy));
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should open a popup", () => {
        new PopupWindow({});

        expect(window.open).toHaveBeenCalled();
    });

    it("should resolve when navigate succeeds", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });

        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "oidc-client", url: "http://app/cb?state=someid" },
            origin: "http://app",
        }));

        await expect(promise).resolves.toHaveProperty("url", "http://app/cb?state=someid");
        const popupFromWindowOpen = firstSuccessfulResult(window.open)!;
        expect(popupFromWindowOpen.location.replace).toHaveBeenCalledWith("http://sts/authorize?x=y");
        expect(popupFromWindowOpen.focus).toHaveBeenCalled();
        expect(popupFromWindowOpen.close).toHaveBeenCalled();
        // assert that timers are cleaned up
        vi.runAllTimers();
    });

    it("should keep the window open after navigate succeeds", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });

        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "oidc-client", url: "http://app/cb?state=someid", keepOpen: true },
            origin: "http://app",
        }));

        await expect(promise).resolves.toHaveProperty("url", "http://app/cb?state=someid");
        const popupFromWindowOpen = firstSuccessfulResult(window.open)!;
        expect(popupFromWindowOpen.location.replace).toHaveBeenCalledWith("http://sts/authorize?x=y");
        expect(popupFromWindowOpen.close).not.toHaveBeenCalled();
        vi.runAllTimers();
    });

    it("should ignore messages from foreign origins", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });

        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "oidc-client", url: "http://app/cb?state=someid&code=foreign-origin" },
            origin: "http://foreign-origin",
        }));
        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "foreign-lib", url: "http://app/cb?state=someid&code=foreign-lib" },
            origin: "http://app",
            source: {} as MessageEventSource,
        }));
        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "oidc-client", url: "http://app/cb?state=someid&code=code" },
            origin: "http://app",
        }));

        await expect(promise).resolves.toHaveProperty("url", "http://app/cb?state=someid&code=code");
        const popupFromWindowOpen = firstSuccessfulResult(window.open)!;
        expect(popupFromWindowOpen.focus).toHaveBeenCalled();
        expect(popupFromWindowOpen.close).toHaveBeenCalled();
    });

    it("should reject when the window is closed by user", async () => {
        const popupWindow = new PopupWindow({ popupAbortOnClose: true });

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });
        definePopupWindowClosedProperty(true);

        vi.runOnlyPendingTimers();
        await expect(promise).rejects.toThrow("Popup closed by user");
        vi.runAllTimers();
    });

    it("should reject when navigate fails", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });
        const popupFromWindowOpen = firstSuccessfulResult(window.open)!;
        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "oidc-client", url: "" },
            origin: "http://app",
            source: popupFromWindowOpen,
        }));

        await expect(promise).rejects.toThrow("Invalid response from window");
        expect(popupFromWindowOpen.location.replace).toHaveBeenCalledWith("http://sts/authorize?x=y");
        vi.runAllTimers();
    });

    it("should reject when the window is closed programmatically", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });
        popupWindow.close();

        await expect(promise).rejects.toThrow("Popup closed");
        vi.runAllTimers();
    });

    it("should reject when the window is aborted by signal", async () => {
        const customReason = "Custom reason";
        const controller = new AbortController();
        const popupWindow = new PopupWindow({ popupSignal: controller.signal });

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });
        controller.abort(customReason);

        await expect(promise).rejects.toThrow(customReason);
        vi.runAllTimers();
    });

    it("should notify the parent window", async () => {
        PopupWindow.notifyOpener("http://sts/authorize?x=y", false);
        expect((window.opener as WindowProxy).postMessage).toHaveBeenCalledWith({
            source: "oidc-client",
            url: "http://sts/authorize?x=y",
            keepOpen: false,
        }, window.location.origin);
    });

    it("should reject when isolated and no state in url", async () => {
        window.opener = null;
        expect(() => {
            PopupWindow.notifyOpener("http://sts/authorize?x=y", false);
        }).toThrow("No parent and no state in URL. Can't complete notification.");
    });

    it("should notify the parent window when isolated", async () => {
        const channelPromise = new Promise((resolve, reject) => {
            const channel = new BroadcastChannel("oidc-client-popup-someid");
            const listener = (e: MessageEvent) => {
                channel.close();
                resolve(e.data);
            };
            channel.addEventListener("message", listener, false);
            setImmediate(() => {
                setImmediate(() => {
                    setImmediate(() => {
                        channel.close();
                        reject(new Error("timed out before receiving message"));
                    });
                });
            });
        });

        window.opener = null;
        PopupWindow.notifyOpener("http://sts/authorize?x=y&state=someid", false);

        expect(await channelPromise).toEqual({
            source: "oidc-client",
            url: "http://sts/authorize?x=y&state=someid",
            keepOpen: false,
        });
    });

    it("should run setTimeout when closePopupWindowAfterInSeconds is greater than 0", async () => {
        vi.spyOn(global, "setTimeout");

        new PopupWindow({ popupWindowFeatures: { closePopupWindowAfterInSeconds: 1 } });

        vi.runOnlyPendingTimers();
        expect(setTimeout).toHaveBeenCalledTimes(1);
        vi.runAllTimers();
    });

    it("shouldn't run setTimeout when closePopupWindowAfterInSeconds is equal to 0", async () => {
        vi.spyOn(global, "setTimeout");

        new PopupWindow({ popupWindowFeatures: { closePopupWindowAfterInSeconds: 0 } });

        vi.runOnlyPendingTimers();
        expect(setTimeout).toHaveBeenCalledTimes(0);
        vi.runAllTimers();
    });

    it("shouldn't run setTimeout when closePopupWindowAfterInSeconds is less than 0", async () => {
        vi.spyOn(global, "setTimeout");

        new PopupWindow({ popupWindowFeatures: { closePopupWindowAfterInSeconds: -120 } });

        vi.runOnlyPendingTimers();
        expect(setTimeout).toHaveBeenCalledTimes(0);
        vi.runAllTimers();
    });

    it("should invoke close popup window when closePopupWindowAfterInSeconds is greater than 0 and window is open", async () => {
        const popupWindow = new PopupWindow({ popupWindowFeatures: { closePopupWindowAfterInSeconds: 1 } });
        definePopupWindowClosedProperty(false);
        const closeWindowSpy = vi.spyOn(popupWindow, "close");

        vi.runOnlyPendingTimers();

        expect(closeWindowSpy).toHaveBeenCalledTimes(1);
        vi.runAllTimers();
    });

    it("shouldn't invoke close popup window when closePopupWindowAfterInSeconds is greater than 0 and window is not open", async () => {
        const popupWindow = new PopupWindow({ popupWindowFeatures: { closePopupWindowAfterInSeconds: 1 } });
        definePopupWindowClosedProperty(true);
        const closeWindowSpy = vi.spyOn(popupWindow, "close");

        vi.runOnlyPendingTimers();

        expect(closeWindowSpy).not.toHaveBeenCalled();
        vi.runAllTimers();
    });

    it("should show error when closePopupWindowAfterInSeconds is greater than 0 and window is not open", async () => {
        Log.setLevel(Log.DEBUG);
        const popupWindow = new PopupWindow({ popupWindowFeatures: { closePopupWindowAfterInSeconds: 1 } });
        const consoleDebugSpy = vi.spyOn(console, "debug");
        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });

        vi.runOnlyPendingTimers();

        await expect(promise).rejects.toThrow("Popup blocked by user");
        expect(consoleDebugSpy).toHaveBeenCalled();
        vi.runAllTimers();
    });
});
