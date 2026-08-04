// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { describe, it, expect } from "vitest";
import { RefreshState } from "./index";

describe("Public API exports", () => {
    describe("RefreshState", () => {
        it("should be exported as a runtime value, not just a type", () => {
            // If RefreshState was exported with `export type`, it would be
            // undefined at runtime because type-only exports are erased.
            expect(RefreshState).toBeDefined();
            expect(typeof RefreshState).toBe("function");
        });

        it("should be constructable", () => {
            const state = new RefreshState({
                refresh_token: "test_refresh_token",
                session_state: "test_session_state",
                profile: {
                    sub: "test_sub",
                },
            });

            expect(state).toBeInstanceOf(RefreshState);
            expect(state.refresh_token).toBe("test_refresh_token");
            expect(state.session_state).toBe("test_session_state");
            expect(state.profile.sub).toBe("test_sub");
        });
    });
});
