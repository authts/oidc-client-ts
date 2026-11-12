import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Clock } from "./Clock";

describe("Clock", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    });

    afterEach(() => {
        Clock.reset();
        vi.useRealTimers();
    });

    it("should return the local epoch time by default", () => {
        expect(Clock.getEpochTime()).toEqual(Date.parse("2026-01-01T00:00:00.000Z") / 1000);
    });

    it("should add the configured offset", () => {
        Clock.setOffset(-120_000);

        expect(Clock.getEpochTime()).toEqual(Date.parse("2025-12-31T23:58:00.000Z") / 1000);
    });

    it("should go back to the local time after reset", () => {
        Clock.setOffset(60_000);
        Clock.reset();

        expect(Clock.getEpochTime()).toEqual(Date.parse("2026-01-01T00:00:00.000Z") / 1000);
    });

    it("should reject an offset that is not a finite number", () => {
        expect(() => Clock.setOffset(Number.NaN)).toThrow("Invalid clock offset");
        expect(() => Clock.setOffset(Number.POSITIVE_INFINITY)).toThrow("Invalid clock offset");
    });
});
