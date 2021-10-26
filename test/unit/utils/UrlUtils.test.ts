// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UrlUtils } from "../../../src/utils";

describe("UrlUtils", () => {

    describe("addQueryParam", () => {

        it("should add ? if not present", () => {
            // act
            const result = UrlUtils.addQueryParam("url", "foo", "test");

            // assert
            expect(result).toEqual("url?foo=test");
        });

        it("should not add ? if already present", () => {
            // act
            const result = UrlUtils.addQueryParam("url?", "foo", "test");

            // assert
            expect(result).toEqual("url?foo=test");
        });

        it("should add & if needed", () => {
            // act
            const result = UrlUtils.addQueryParam("url?x=1", "foo", "test");

            // assert
            expect(result).toEqual("url?x=1&foo=test");
        });

        it("should stringify boolean values", () => {
            // act
            let result = UrlUtils.addQueryParam("url?x=1", "foo", true);
            result = UrlUtils.addQueryParam(result, "bar", false);

            // assert
            expect(result).toEqual("url?x=1&foo=true&bar=false");
        });

        it("should stringify numeric values", () => {
            // act
            const result = UrlUtils.addQueryParam("url?x=1", "foo", 1.2);

            // assert
            expect(result).toEqual("url?x=1&foo=1.2");
        });

        it("should url encode key and value", () => {
            // act
            const result = UrlUtils.addQueryParam("url", "#", "#");

            // assert
            expect(result).toEqual("url?%23=%23");
        });
    });

    describe("parseUrlFragment", () => {

        it("should parse key/value pairs", () => {
            // act
            const result = UrlUtils.parseUrlFragment("a=apple&b=banana&c=carrot");

            // assert
            expect(result).toEqual({ a: "apple", b: "banana", c: "carrot" });
        });

        it("should parse any order", () => {
            // act
            const result = UrlUtils.parseUrlFragment("b=banana&c=carrot&a=apple");

            // assert
            expect(result).toEqual({ a: "apple", b: "banana", c: "carrot" });
        });

        it("should parse past host name and hash fragment", () => {
            // act
            const result = UrlUtils.parseUrlFragment("http://server?test1=xoxo&test2=xoxo/#a=apple&b=banana&c=carrot");

            // assert
            expect(result).toEqual({ a: "apple", b: "banana", c: "carrot" });
        });

        it("should parse query string", () => {
            // act
            const result = UrlUtils.parseUrlFragment("http://server?test1=xoxo&test2=yoyo", "?");

            // assert
            expect(result).toEqual({ test1: "xoxo", test2: "yoyo" });
        });

        it("should parse query string up to hash", () => {
            // act
            const result = UrlUtils.parseUrlFragment("http://server?test1=xoxo&test2=yoyo#a=apple&b=banana&c=carrot", "?");

            // assert
            expect(result).toEqual({ test1: "xoxo", test2: "yoyo" });
        });

        it("should return error for long values", () => {
            // act
            const result = UrlUtils.parseUrlFragment("a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple&a=apple");

            // assert
            expect(result).toHaveProperty("error");
        });

        it("should return empty object for empty string", () => {
            // act
            const result = UrlUtils.parseUrlFragment("");

            // assert
            expect(result).toEqual({});
        });
    });
});
