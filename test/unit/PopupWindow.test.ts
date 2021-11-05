import { PopupWindow } from "../../src/navigators/PopupWindow";

describe("PopupWindow", () => {
    let popupFromWindowOpen: WindowProxy;

    beforeEach(() => {
        Object.defineProperty(window, "location", {
            writable: true,
            value: { origin: "http://app" }
        });

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
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(popupFromWindowOpen.location.replace).toHaveBeenCalledWith("http://sts/authorize?x=y");
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
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(popupFromWindowOpen.location.replace).toHaveBeenCalledWith("http://sts/authorize?x=y");
    });
});
