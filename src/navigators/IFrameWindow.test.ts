import { IFrameWindow } from "./IFrameWindow";
import type { NavigateParams } from "./IWindow";

describe("IFrameWindow", () => {
    const postMessageMock = jest.fn();
    const fakeWindowOrigin = "https://fake-origin.com";
    const fakeUrl = "https://fakeurl.com";

    afterEach(() => {
        jest.clearAllMocks();
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

        it("should set correct sandbox attribute", () => {
            const sandboxAttr = frameWindow["_frame"]!.attributes.getNamedItem("sandbox");
            expect(sandboxAttr?.value).toBe("allow-scripts allow-same-origin allow-forms");
        });
    });

    describe("close", () => {
        let subject: IFrameWindow;
        const parentRemoveChild = jest.fn();
        beforeEach(() => {
            subject = new IFrameWindow({});
            jest.spyOn(subject["_frame"]!, "parentNode", "get").mockReturnValue({
                removeChild: parentRemoveChild,
            } as unknown as ParentNode);
        });

        it("should reset window to null", () => {
            subject.close();
            expect(subject["_window"]).toBeNull();
        });

        describe("if frame defined", () => {
            it("should set blank url for contentWindow", () => {
                const replaceMock = jest.fn();
                jest.spyOn(subject["_frame"]!, "contentWindow", "get")
                    .mockReturnValue({ location: { replace: replaceMock } } as unknown as WindowProxy);

                subject.close();
                expect(replaceMock).toBeCalledWith("about:blank");
            });

            it("should reset frame to null", () => {
                subject.close();
                expect(subject["_frame"]).toBeNull();
            });
        });
    });

    describe("navigate", () => {
        const contentWindowMock = jest.fn();

        beforeAll(() => {
            jest.spyOn(window, "parent", "get").mockReturnValue({
                postMessage: postMessageMock,
            } as unknown as WindowProxy);
            Object.defineProperty(window, "location", {
                enumerable: true,
                value: { origin: fakeWindowOrigin },
            });

            contentWindowMock.mockReturnValue(null);
            jest.spyOn(window.document.body, "appendChild").mockImplementation();
            jest.spyOn(window.document, "createElement").mockReturnValue(({
                contentWindow: contentWindowMock(),
                style: {},
                setAttribute: jest.fn(),
            } as unknown as HTMLIFrameElement),
            );
        });

        it("when frame.contentWindow is not defined should throw error", async() => {
            const frameWindow = new IFrameWindow({});
            await expect(frameWindow.navigate({} as NavigateParams))
                .rejects
                .toMatchObject({ message: "Attempted to navigate on a disposed window" });
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
            expect(postMessageMock).toBeCalledWith(messageData, expectedOrigin);
        });
    });
});
