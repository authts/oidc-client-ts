/* eslint-disable @typescript-eslint/unbound-method */
import { PopupWindow } from "./PopupWindow";

describe("PopupWindow", () => {
    let popupFromWindowOpen: WindowProxy;

    beforeEach(() => {
        Object.defineProperty(window, "location", {
            writable: true,
            value: { origin: "http://app" }
        });

        window.opener = {
            postMessage: jest.fn(),
        };
        window.open = jest.fn().mockImplementation(() => {
            popupFromWindowOpen = {
                location: { replace: jest.fn() },
                focus: jest.fn(),
                close: jest.fn(),
            } as any;

            return popupFromWindowOpen;
        });
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
            origin: "http://app"
        }));

        await expect(promise).resolves.toHaveProperty("url", "http://app/cb?state=someid");
        expect(popupFromWindowOpen.location.replace).toHaveBeenCalledWith("http://sts/authorize?x=y");
        expect(popupFromWindowOpen.focus).toHaveBeenCalled();
        expect(popupFromWindowOpen.close).toHaveBeenCalled();
    });

    it("should keep the window open after navigate succeeds", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });

        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "oidc-client", url: "http://app/cb?state=someid", keepOpen: true },
            origin: "http://app"
        }));

        await expect(promise).resolves.toHaveProperty("url", "http://app/cb?state=someid");
        expect(popupFromWindowOpen.location.replace).toHaveBeenCalledWith("http://sts/authorize?x=y");
        expect(popupFromWindowOpen.close).not.toHaveBeenCalled();
    });

    it("should ignore messages from foreign origins", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });

        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "oidc-client", url: "http://app/cb?state=someid&code=foreign-origin" },
            origin: "http://foreign-origin"
        }));
        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "foreign-lib", url: "http://app/cb?state=someid&code=foreign-lib" },
            origin: "http://app",
            source: {} as MessageEventSource
        }));
        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "oidc-client", url: "http://app/cb?state=someid&code=code" },
            origin: "http://app"
        }));

        await expect(promise).resolves.toHaveProperty("url", "http://app/cb?state=someid&code=code");
        expect(popupFromWindowOpen.focus).toHaveBeenCalled();
        expect(popupFromWindowOpen.close).toHaveBeenCalled();
    });

    it("should reject when navigate fails", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });
        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "oidc-client", url: "" },
            origin: "http://app",
            source: popupFromWindowOpen,
        }));

        await expect(promise).rejects.toThrow("Invalid response from window");
        expect(popupFromWindowOpen.location.replace).toHaveBeenCalledWith("http://sts/authorize?x=y");
    });

    it("should reject when the window is closed by user", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });
        Object.defineProperty(popupFromWindowOpen, "closed", {
            enumerable: true,
            value: true,
        });

        await expect(promise).rejects.toThrow("Popup closed by user");
    });

    it("should reject when the window is closed programmatically", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "http://sts/authorize?x=y", state: "someid" });
        popupWindow.close();

        await expect(promise).rejects.toThrow("Popup closed");
    });

    it("should notify the parent window", async () => {
        PopupWindow.notifyOpener("http://sts/authorize?x=y", false);
        expect(window.opener.postMessage).toHaveBeenCalledWith({
            source: "oidc-client",
            url: "http://sts/authorize?x=y",
            keepOpen: false,
        }, window.location.origin);
    });
});
