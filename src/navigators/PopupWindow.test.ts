import { mocked } from "jest-mock";
import { PopupWindow } from "./PopupWindow";
import { Log } from "../utils";

function firstSuccessfulResult<T>(fn: () => T): T {
    expect(fn).toHaveReturned();
    return mocked(fn).mock.results[0].value as T;
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

        window.opener = {
            postMessage: jest.fn(),
        };
        window.open = jest.fn(() => ({
            location: { replace: jest.fn() },
            focus: jest.fn(),
            close: jest.fn(),
        } as unknown as WindowProxy));
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
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
        jest.runAllTimers();
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
        jest.runAllTimers();
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
        jest.runAllTimers();
    });

    it("should reject when the window is closed by user", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });
        definePopupWindowClosedProperty(true);

        jest.runOnlyPendingTimers();
        await expect(promise).rejects.toThrow("Popup closed by user");
        jest.runAllTimers();
    });

    it("should reject when the window is closed programmatically", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });
        popupWindow.close();

        await expect(promise).rejects.toThrow("Popup closed");
        jest.runAllTimers();
    });

    it("should reject when the window is aborted by signal", async () => {
        const customReason = "Custom reason";
        const controller = new AbortController();
        const popupWindow = new PopupWindow({ popupSignal: controller.signal });

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });
        controller.abort(customReason);

        await expect(promise).rejects.toThrow(customReason);
        jest.runAllTimers();
    });

    it("should notify the parent window", async () => {
        PopupWindow.notifyOpener("http://sts/authorize?x=y", false);
        expect((window.opener as WindowProxy).postMessage).toHaveBeenCalledWith({
            source: "oidc-client",
            url: "http://sts/authorize?x=y",
            keepOpen: false,
        }, window.location.origin);
    });

    it("should run setTimeout when closePopupWindowAfterInSeconds is greater than 0", async () => {
        jest.spyOn(global, "setTimeout");

        new PopupWindow({ popupWindowFeatures: { closePopupWindowAfterInSeconds: 1 } });

        jest.runOnlyPendingTimers();
        expect(setTimeout).toHaveBeenCalledTimes(1);
        jest.runAllTimers();
    });

    it("shouldn't run setTimeout when closePopupWindowAfterInSeconds is equal to 0", async () => {
        jest.spyOn(global, "setTimeout");

        new PopupWindow({ popupWindowFeatures: { closePopupWindowAfterInSeconds: 0 } });

        jest.runOnlyPendingTimers();
        expect(setTimeout).toHaveBeenCalledTimes(0);
        jest.runAllTimers();
    });

    it("shouldn't run setTimeout when closePopupWindowAfterInSeconds is less than 0", async () => {
        jest.spyOn(global, "setTimeout");

        new PopupWindow({ popupWindowFeatures: { closePopupWindowAfterInSeconds: -120 } });

        jest.runOnlyPendingTimers();
        expect(setTimeout).toHaveBeenCalledTimes(0);
        jest.runAllTimers();
    });

    it("should invoke close popup window when closePopupWindowAfterInSeconds is greater than 0 and window is open", async () => {
        const popupWindow = new PopupWindow({ popupWindowFeatures: { closePopupWindowAfterInSeconds: 1 } });
        definePopupWindowClosedProperty(false);
        const closeWindowSpy = jest.spyOn(popupWindow, "close");

        jest.runOnlyPendingTimers();

        expect(closeWindowSpy).toHaveBeenCalledTimes(1);
        jest.runAllTimers();
    });

    it("shouldn't invoke close popup window when closePopupWindowAfterInSeconds is greater than 0 and window is not open", async () => {
        const popupWindow = new PopupWindow({ popupWindowFeatures: { closePopupWindowAfterInSeconds: 1 } });
        definePopupWindowClosedProperty(true);
        const closeWindowSpy = jest.spyOn(popupWindow, "close");

        jest.runOnlyPendingTimers();

        expect(closeWindowSpy).not.toHaveBeenCalled();
        jest.runAllTimers();
    });

    it("should show error when closePopupWindowAfterInSeconds is greater than 0 and window is not open", async () => {
        Log.setLevel(Log.DEBUG);
        const popupWindow = new PopupWindow({ popupWindowFeatures: { closePopupWindowAfterInSeconds: 1 } });
        const consoleDebugSpy = jest.spyOn(console, "debug");
        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });

        jest.runOnlyPendingTimers();

        await expect(promise).rejects.toThrow("Popup blocked by user");
        expect(consoleDebugSpy).toHaveBeenCalled();
        jest.runAllTimers();
    });
});
