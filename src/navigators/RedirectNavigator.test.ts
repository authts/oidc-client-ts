import { mocked } from "jest-mock";
import type { UserManagerSettingsStore } from "../UserManagerSettings";
import { RedirectNavigator } from "./RedirectNavigator";

describe("RedirectNavigator", () => {
    const settings = { redirectMethod: "assign" } as UserManagerSettingsStore;
    const navigator = new RedirectNavigator(settings);

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should redirect to the authority server using the default redirect method", async () => {
        const handle = await navigator.prepare({});
        void handle.navigate({ url: "http://sts/authorize" });

        expect(window.location.assign).toHaveBeenCalledWith("http://sts/authorize");
    });

    it("should redirect to the authority server using a specific redirect method", async () => {
        const handle = await navigator.prepare({ redirectMethod: "replace" });
        const spy = jest.fn();
        handle.navigate({ url: "http://sts/authorize" }).finally(spy);

        expect(window.location.replace).toHaveBeenCalledWith("http://sts/authorize");

        // We check that the promise does not resolve even after the window
        // unload event
        await new Promise<void>(resolve => {
            const listener = () => {
                resolve();
                window.removeEventListener("unload", listener);
            };
            window.addEventListener("unload", listener);
        });
        expect(spy).not.toHaveBeenCalled();
    });

    it("should reject when the navigation is stopped programmatically", async () => {
        const handle = await navigator.prepare({});
        mocked(window.location.assign).mockReturnValue(undefined);
        const promise = handle.navigate({ url: "http://sts/authorize" });

        handle.close();
        await expect(promise).rejects.toThrow("Redirect aborted");
    });
});
