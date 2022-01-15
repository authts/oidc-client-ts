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
        await handle.navigate({ url: "http://sts/authorize" });

        expect(window.location.replace).toHaveBeenCalledWith("http://sts/authorize");
    });

    it("should reject when the navigation is stopped programmatically", async () => {
        const handle = await navigator.prepare({});
        mocked(window.location.assign).mockReturnValue(undefined);
        const promise = handle.navigate({ url: "http://sts/authorize" });

        handle.close();
        await expect(promise).rejects.toThrow("Redirect aborted");
    });
});
