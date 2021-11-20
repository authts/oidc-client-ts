import { PopupUtils } from "./PopupUtils";

describe("PopupUtils", () => {
    describe("center", () => {
        it("should center a window to integer offsets", () => {
            Object.defineProperties(window, {
                screenX: { enumerable: true, value: 50 },
                screenY: { enumerable: true, value: 50 },
                outerWidth: { enumerable: true, value: 101 },
                outerHeight: { enumerable: true, value: 101 },
            });
            const features = PopupUtils.center({
                width: 100,
                height: 100,
            });

            expect(features.left).toBe(51);
            expect(features.top).toBe(51);
        });

        it("should restrict window placement to nonnegative offsets", () => {
            Object.defineProperties(window, {
                screenX: { enumerable: true, value: 0 },
                screenY: { enumerable: true, value: 0 },
                outerWidth: { enumerable: true, value: 50 },
                outerHeight: { enumerable: true, value: 50 },
            });
            const features = PopupUtils.center({
                width: 100,
                height: 100,
            });

            expect(features.left).toBe(0);
            expect(features.top).toBe(0);
        });
    });

    describe("serialize", () => {
        it("should encode boolean values as yes/no", () => {
            const result = PopupUtils.serialize({ foo: true, bar: false });

            expect(result).toEqual("foo=yes,bar=no");
        });

        it("should omit undefined properties", () => {
            const result = PopupUtils.serialize({ foo: true, bar: undefined });

            expect(result).toEqual("foo=yes");
        });

        it("should preserve numerical and string values", () => {
            const result = PopupUtils.serialize({ foo: "yes", bar: 0, baz: 20, quux: "" });

            expect(result).toEqual("foo=yes,bar=0,baz=20,quux=");
        });
    });
});
