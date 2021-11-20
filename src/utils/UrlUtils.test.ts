// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UrlUtils } from "./UrlUtils";

describe("UrlUtils", () => {

    describe("readUrlParams", () => {

        it("should return query params by default", () => {
            // act
            const result = UrlUtils.readParams("http://app/?foo=test");
            const resultObj = Object.fromEntries(result);

            // assert
            expect(resultObj).toHaveProperty("foo", "test");
        });

        it("should return fragment params for response_mode=fragment", () => {
            // act
            const result = UrlUtils.readParams("http://app/?foo=test#bar=test_fragment", "fragment");
            const resultObj = Object.fromEntries(result);

            // assert
            expect(resultObj).toHaveProperty("bar", "test_fragment");
        });
    });
});
