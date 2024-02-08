import { IFrameWindow } from "./IFrameWindow";
import type { NavigateParams } from "./IWindow";

const flushPromises = () => new Promise(process.nextTick);

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
                expect(replaceMock).toHaveBeenCalledWith("about:blank");
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
            jest.spyOn(window.document, "createElement").mockImplementation(() => ({
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

        describe("when message received", () => {
            const fakeState = "fffaaakkkeee_state";
            const fakeContentWindow = { location: { replace: jest.fn() } };
            const validNavigateParams = {
                source: fakeContentWindow,
                data: { source: "oidc-client",
                    url: `https://test.com?state=${fakeState}` },
                origin: fakeWindowOrigin,
            };
            const navigateParamsStub = jest.fn();

            beforeAll(() => {
                contentWindowMock.mockReturnValue(fakeContentWindow);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                jest.spyOn(window, "addEventListener").mockImplementation((_, listener: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    listener(navigateParamsStub());
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

                const frameWindow = new IFrameWindow({});
                const promise = frameWindow.navigate({ state: fakeState, url: fakeUrl, scriptOrigin: args.passedOrigin });

                void promise.finally(() => promiseDone = true);
                await flushPromises();

                expect(promiseDone).toBe(false);
            });

            it("and data url parse fails should reject with error", async () => {
                navigateParamsStub.mockReturnValue({ ...validNavigateParams, data: { ...validNavigateParams.data, url: undefined } });
                const frameWindow = new IFrameWindow({});
                await expect(frameWindow.navigate({ state: fakeState, url: fakeUrl })).rejects.toThrowError("Invalid response from window");
            });

            it("and args source with state do not match contentWindow should never resolve", async () => {
                let promiseDone = false;
                navigateParamsStub.mockReturnValue({ ...validNavigateParams, source: {} });

                const frameWindow = new IFrameWindow({});
                const promise = frameWindow.navigate({ state: "diff_state", url: fakeUrl });

                void promise.finally(() => promiseDone = true);
                await flushPromises();

                expect(promiseDone).toBe(false);
            });
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
