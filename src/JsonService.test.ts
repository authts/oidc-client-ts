// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { ErrorResponse } from "./errors";
import { JsonService } from "./JsonService";

import { mocked } from "jest-mock";
import { DPoPService } from "./DPoPService";

describe("JsonService", () => {
    let subject: JsonService;
    let customStaticHeaderSubject: JsonService;
    let customDynamicHeaderSubject: JsonService;

    const staticExtraHeaders = {
        "Custom-Header-1": "this-is-header-1",
        "Custom-Header-2": "this-is-header-2",
        "acCept" : "application/fake",
        "AuthoriZation" : "not good",
        "Content-Type": "application/fail",
    };
    const dynamicExtraHeaders = {
        "Custom-Header-1": () => "my-name-is-header-1",
        "Custom-Header-2": () => {
            return "my-name-is-header-2";
        },
        "acCept" : () => "nothing",
        "AuthoriZation" : () => "not good",
        "Content-Type": "application/fail",
    };

    beforeEach(() =>{
        subject = new JsonService();
        customStaticHeaderSubject = new JsonService(undefined, null, staticExtraHeaders);
        customDynamicHeaderSubject = new JsonService(undefined, null, dynamicExtraHeaders);
    });

    describe("getJson", () => {
        it("should make GET request to url", async () => {
            // act
            await expect(subject.getJson("http://test")).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: { Accept: "application/json" },
                    method: "GET",
                }),
            );
        });

        it("should make GET request to url with static custom headers", async () => {
            // act
            await expect(customStaticHeaderSubject.getJson("http://test")).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        Accept: "application/json",
                        "Custom-Header-1": "this-is-header-1",
                        "Custom-Header-2": "this-is-header-2",
                    },
                    method: "GET",
                }),
            );
        });

        it("should make GET request to url with dynamic custom headers", async () => {
            // act
            await expect(customDynamicHeaderSubject.getJson("http://test")).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        Accept: "application/json",
                        "Custom-Header-1": "my-name-is-header-1",
                        "Custom-Header-2": "my-name-is-header-2",
                    },
                    method: "GET",
                }),
            );
        });

        it("should set token as authorization header", async () => {
            // act
            await expect(subject.getJson("http://test", { token: "token" })).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: { Accept: "application/json", Authorization: "Bearer token" },
                    method: "GET",
                }),
            );
        });

        it("should set token as authorization header with static custom headers", async () => {
            // act
            await expect(customStaticHeaderSubject.getJson("http://test", { token: "token" })).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        Accept: "application/json",
                        Authorization: "Bearer token",
                        "Custom-Header-1": "this-is-header-1",
                        "Custom-Header-2": "this-is-header-2",
                    },
                    method: "GET",
                }),
            );
        });

        it("should set token as authorization header with dynamic custom headers", async () => {
            // act
            await expect(customDynamicHeaderSubject.getJson("http://test", { token: "token" })).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        Accept: "application/json",
                        Authorization: "Bearer token",
                        "Custom-Header-1": "my-name-is-header-1",
                        "Custom-Header-2": "my-name-is-header-2",
                    },
                    method: "GET",
                }),
            );
        });

        it("should fulfill promise when http response is 200", async () => {
            // arrange
            const json = { foo: 1, bar: "test" };
            mocked(fetch).mockResolvedValue({
                status: 200,
                ok: true,
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
                json: () => Promise.resolve(json),
            } as Response);

            // act
            const result = await subject.getJson("http://test");

            // assert
            expect(result).toEqual(json);
        });

        it("should reject promise when http response is 200 and json is not able to parse", async () => {
            // arrange
            const error = new SyntaxError("Unexpected token a in JSON");
            mocked(fetch).mockResolvedValue({
                status: 200,
                ok: true,
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
                json: () => Promise.reject(error),
            } as Response);

            // act
            await expect(subject.getJson("http://test"))
                // assert
                .rejects.toThrow(error);
        });

        it("should reject promise when http response is not 200", async () => {
            // arrange
            mocked(fetch).mockResolvedValue({
                status: 500,
                statusText: "server error",
                ok: false,
                headers: new Headers(),
                json: () => Promise.reject(new SyntaxError()),
            } as Response);

            // act
            await expect(subject.getJson("http://test"))
                // assert
                .rejects.toThrow(/server error.+500/);
        });

        it("should reject promise when http response is error", async () => {
            // arrange
            mocked(fetch).mockRejectedValue(new Error("Network Error"));

            // act
            await expect(subject.getJson("http://test"))
                // assert
                .rejects.toThrow("Network Error");
        });

        it("should reject promise when http response content type is not json", async () => {
            // arrange
            const json = { foo: 1, bar: "test" };
            mocked(fetch).mockResolvedValue({
                status: 200,
                ok: true,
                headers: new Headers({
                    "Content-Type": "text/html",
                }),
                json: () => Promise.resolve(json),
            } as Response);

            // act
            await expect(subject.getJson("http://test"))
                // assert
                .rejects.toThrow("Invalid response Content-Type: text/html");
        });

        it("should accept custom content type in response", async () => {
            // arrange
            subject = new JsonService(["foo/bar"]);
            const json = { foo: 1, bar: "test" };
            mocked(fetch).mockResolvedValue({
                status: 200,
                ok: true,
                headers: new Headers({
                    "Content-Type": "foo/bar",
                }),
                json: () => Promise.resolve(json),
            } as Response);

            // act
            const result = await subject.getJson("http://test");

            // assert
            expect(result).toEqual(json);
        });

        it("should work with custom jwtHandler", async () => {
            // arrange
            const jwtHandler = jest.fn();
            subject = new JsonService([], jwtHandler);
            const text = "text";
            mocked(fetch).mockResolvedValue({
                status: 200,
                ok: true,
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "application/jwt",
                }),
                text: () => Promise.resolve(text),
            } as Response);

            // act
            await subject.getJson("http://test");

            // assert
            expect(jwtHandler).toBeCalledWith(text);
        });
    });

    describe("postForm", () => {
        it("should make POST request to url", async () => {
            // act
            await expect(subject.postForm("http://test", { body: new URLSearchParams("a=b") })).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    method: "POST",
                    body: new URLSearchParams(),
                }),
            );
        });

        it("should make POST request to url with custom static headers", async () => {
            // act
            await expect(customStaticHeaderSubject.postForm("http://test", { body: new URLSearchParams("a=b") })).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Custom-Header-1": "this-is-header-1",
                        "Custom-Header-2": "this-is-header-2",
                    },
                    method: "POST",
                    body: new URLSearchParams(),
                }),
            );
        });

        it("should make POST request to url with custom dynamic headers", async () => {
            // act
            await expect(customDynamicHeaderSubject.postForm("http://test", { body: new URLSearchParams("a=b") })).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Custom-Header-1": "my-name-is-header-1",
                        "Custom-Header-2": "my-name-is-header-2",
                    },
                    method: "POST",
                    body: new URLSearchParams(),
                }),
            );
        });

        it("should set basicAuth as authorization header", async () => {
            // act
            await expect(subject.postForm("http://test", { body: new URLSearchParams("payload=dummy"), basicAuth: "basicAuth" })).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        Accept: "application/json",
                        Authorization: "Basic basicAuth",
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    method: "POST",
                    body: new URLSearchParams(),
                }),
            );
        });

        it("should set dpop proof as header if dpop is enabled", async () => {
            // act
            await expect(subject.postForm("http://test", { body: new URLSearchParams("payload=dummy"), dpopEnabled: true })).rejects.toThrow();
            await expect(subject.postForm("http://test", { body: new URLSearchParams("payload=dummy"), basicAuth: "basicAuth", dpopEnabled: true })).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledTimes(2);
            expect(fetch).toHaveBeenLastCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        Accept: "application/json",
                        Authorization: "Basic basicAuth",
                        "Content-Type": "application/x-www-form-urlencoded",
                        DPoP: expect.any(String),
                    },
                    method: "POST",
                    body: new URLSearchParams(),
                }),
            );
        });

        it("should set payload as body", async () => {
            // act
            await expect(subject.postForm("http://test", { body: new URLSearchParams("payload=dummy") })).rejects.toThrow();

            // assert
            const body = new URLSearchParams();
            body.set("payload", "dummy");

            expect(fetch).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    method: "POST",
                    body,
                }),
            );
        });

        it("should fulfill promise when http response is 200", async () => {
            // arrange
            const json = { foo: 1, bar: "test" };
            mocked(fetch).mockResolvedValue({
                status: 200,
                ok: true,
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "application/json",
                }),
                text: () => Promise.resolve(JSON.stringify(json)),
            } as Response);

            // act
            const result = await subject.postForm("http://test", { body: new URLSearchParams("payload=dummy") });

            // assert
            expect(result).toEqual(json);
        });

        it("should reject promise when http response is error", async () => {
            // arrange
            mocked(fetch).mockRejectedValue(new Error("Network Error"));

            // act
            await expect(subject.postForm("http://test", { body: new URLSearchParams("payload=dummy") }))
                // assert
                .rejects.toThrow("Network Error");
        });

        it("should reject promise when http response is 200 and json is not able to parse", async () => {
            // arrange
            const error = new SyntaxError("Unexpected token a in JSON");
            mocked(fetch).mockResolvedValue({
                status: 200,
                ok: true,
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "application/json",
                }),
                text: () => Promise.reject(error),
            } as Response);

            // act
            await expect(subject.postForm("http://test", { body: new URLSearchParams("payload=dummy") }))
                // assert
                .rejects.toThrow(error);
        });

        it("should reject promise when http response is 200 and content type is not json", async () => {
            // arrange
            const json = { foo: 1, bar: "test" };
            mocked(fetch).mockResolvedValue({
                status: 200,
                ok: true,
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "text/html",
                }),
                text: () => Promise.resolve(JSON.stringify(json)),
            } as Response);

            // act
            await expect(subject.postForm("http://test", { body: new URLSearchParams("payload=dummy") }))
                // assert
                .rejects.toThrow("Invalid response Content-Type: text/html");
        });

        it("should reject promise when http response is 400 and json has error field", async () => {
            // arrange
            const json = { error: "error" };
            mocked(fetch).mockResolvedValue({
                status: 400,
                ok: false,
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "application/json",
                }),
                text: () => Promise.resolve(JSON.stringify(json)),
            } as Response);

            // act
            await expect(subject.postForm("http://test", { body: new URLSearchParams("payload=dummy") }))
                // assert
                .rejects.toThrow(ErrorResponse);
        });

        it("should retry with server supplied nonce value from response header when http response is 400 and json error is 'use_dpop_nonce'", async () => {
            // arrange
            const json = { error: "use_dpop_nonce" };
            const dpopServiceMock = jest.spyOn(DPoPService, "generateDPoPProof").mockImplementation(() => Promise.resolve("some-proof"));

            const fetchMock = mocked(fetch)
                .mockResolvedValueOnce({
                    status: 400,
                    ok: false,
                    headers: new Headers({
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "DPoP-Nonce": "eyJ7S_zG.eyJH0-Z.JX4w-7v",
                    }),
                    text: () => Promise.resolve(JSON.stringify(json)),
                } as Response).mockResolvedValueOnce({
                    status: 200,
                    ok: true,
                    headers: new Headers({
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    }),
                    text: () => Promise.resolve(JSON.stringify({ foo: 1, bar: "test" })),
                } as Response);

            // act
            await subject.postForm("http://test", { body: new URLSearchParams("payload=dummy"), dpopEnabled: true, basicAuth: "some-access-token" });

            // assert
            expect(fetchMock).toBeCalledTimes(2);
            expect(dpopServiceMock).toBeCalledTimes(2);
            expect(dpopServiceMock).toHaveBeenLastCalledWith("http://test", undefined, "POST", "eyJ7S_zG.eyJH0-Z.JX4w-7v");
        });

        it("should reject promise when http response is 400 and json has no error field", async () => {
            // arrange
            const json = { foo: 1, bar: "test" };
            mocked(fetch).mockResolvedValue({
                status: 400,
                ok: false,
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "application/json",
                }),
                text: () => Promise.resolve(JSON.stringify(json)),
            } as Response);

            // act
            await expect(subject.postForm("http://test", { body: new URLSearchParams("payload=dummy") }))
                // assert
                .rejects.toThrow(JSON.stringify(json));
        });

        it("should reject promise when http response is 400 and json is not able to parse", async () => {
            // arrange
            mocked(fetch).mockResolvedValue({
                status: 400,
                statusText: "bad request",
                ok: false,
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "application/json",
                }),
                text: () => Promise.resolve("not_json_data"),
            } as Response);

            // act
            await expect(subject.postForm("http://test", { body: new URLSearchParams("payload=dummy") }))
                // assert
                .rejects.toThrow(/bad request.+400/);
        });

        it("should reject promise when http response is 400 and content type is not json", async () => {
            // arrange
            const json = { foo: 1, bar: "test" };
            mocked(fetch).mockResolvedValue({
                status: 400,
                ok: false,
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "text/html",
                }),
                text: () => Promise.resolve(JSON.stringify(json)),
            } as Response);

            // act
            await expect(subject.postForm("http://test", { body: new URLSearchParams("payload=dummy") }))
                // assert
                .rejects.toThrow("Invalid response Content-Type: text/html");
        });

        it("should reject promise when http response is not 200", async () => {
            // arrange
            const json = {};
            mocked(fetch).mockResolvedValue({
                status: 500,
                statusText: "server error",
                ok: false,
                headers: new Headers(),
                text: () => Promise.resolve(JSON.stringify(json)),
            } as Response);

            // act
            await expect(subject.postForm("http://test", { body: new URLSearchParams("payload=dummy") }))
                // assert
                .rejects.toThrow(/server error.+500/);
        });

        it("should accept custom content type in response", async () => {
            // arrange
            subject = new JsonService(["foo/bar"]);
            const json = { foo: 1, bar: "test" };
            mocked(fetch).mockResolvedValue({
                status: 200,
                ok: true,
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "foo/bar",
                }),
                text: () => Promise.resolve(JSON.stringify(json)),
            } as Response);

            // act
            const result = await subject.postForm("http://test", { body: new URLSearchParams("payload=dummy") });

            // assert
            expect(result).toEqual(json);
        });
    });
});
