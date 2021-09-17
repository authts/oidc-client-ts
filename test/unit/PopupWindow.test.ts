import { PopupWindow } from '../../src/navigators/PopupWindow';

describe("PopupWindow", () => {
    let popupFromWindowOpen: { window: { location: { assign: () => void } }, focus: () => void, close: () => void };

    beforeEach(() => {
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { origin: 'myapp.com' }
        });

        window.open = jest.fn().mockImplementation(() => {
            popupFromWindowOpen = {
                window: { location: { assign: jest.fn() } },
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

    it("should navigate", () => {
        const popupWindow = new PopupWindow({});

        popupWindow.navigate({ url: "https://myidp.com/authorize?x=y" });

        expect(popupFromWindowOpen.window.location.assign).toHaveBeenCalledWith("https://myidp.com/authorize?x=y");
    });

    it("should resolve when auth succeeds", (done) => {
        const popupWindow = new PopupWindow({});

        popupWindow.navigate({ url: "https://myidp.com/authorize?x=y", id: 'someid' }).then((data) => {
            expect(data.url).toBe('https://myapp.com');
            done();
        });

        window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({ data: { state: 'someid' }, url: 'https://myapp.com' }),
            origin: 'myapp.com'
        }));
    });

    it("should reject when auth fails", (done) => {
        const popupWindow = new PopupWindow({});

        popupWindow.navigate({ url: "https://myidp.com/authorize?x=y", id: 'someid' }).catch((error: Error) => {
            expect(error.message).toBe("Invalid response from popup");
            done();
        });

        window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({ data: { state: 'someid' }, url: '' }),
            origin: 'myapp.com'
        }));
    });
});
