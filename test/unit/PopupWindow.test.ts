import { PopupWindow } from "../../src/navigators/PopupWindow";

describe("PopupWindow", () => {
    let popupFromWindowOpen: { location: { replace: () => void }; focus: () => void; close: () => void };

    beforeEach(() => {
        Object.defineProperty(window, "location", {
            writable: true,
            value: { origin: "myapp.com" }
        });

        window.open = jest.fn().mockImplementation(() => {
            popupFromWindowOpen = {
                location: { replace: jest.fn() },
                focus: jest.fn(),
                close: jest.fn(),
            };

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

        const promise = popupWindow.navigate({ url: "https://myidp.com/authorize?x=y", state: "someid" });

        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "oidc-client", data: { state: "someid" }, url: "https://myapp.com" },
            origin: "myapp.com"
        }));

        await expect(promise).resolves.toHaveProperty("url", "https://myapp.com");
        expect(popupFromWindowOpen.location.replace).toHaveBeenCalledWith("https://myidp.com/authorize?x=y");
    });

    it("should reject when navigate fails", async () => {
        const popupWindow = new PopupWindow({});

        const promise = popupWindow.navigate({ url: "https://myidp.com/authorize?x=y", state: "someid" });
        window.dispatchEvent(new MessageEvent("message", {
            data: { source: "oidc-client", data: { state: "someid" }, url: "" },
            origin: "myapp.com"
        }));

        await expect(promise).rejects.toThrow("Invalid response from window");
        expect(popupFromWindowOpen.location.replace).toHaveBeenCalledWith("https://myidp.com/authorize?x=y");
    });
});
