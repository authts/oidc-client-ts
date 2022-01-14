// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { ErrorResponse } from "./errors";
import { JsonService } from "./JsonService";
import { mocked } from "jest-mock";

describe("JsonService", () => {
    let subject: JsonService;

    beforeEach(() =>{
        subject = new JsonService();
    });

    describe("getJson", () => {
        it("should make GET request to url", async () => {
            // act
            await expect(subject.getJson("http://test")).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledWith("http://test", {
                headers: { Accept: "application/json" },
                method: "GET",
            });
        });

        it("should set token as authorization header", async () => {
            // act
            await expect(subject.getJson("http://test", "token")).rejects.toThrow();

            // assert
            expect(fetch).toBeCalledWith("http://test", {
                headers: { Accept: "application/json", Authorization: "Bearer token" },
                method: "GET",
            });
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
            await expect(subject.postForm("http://test", new URLSearchParams("a=b"))).rejects.toThrow();

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

        it("should set basicAuth as authorization header", async () => {
            // act
            await expect(subject.postForm("http://test", new URLSearchParams("payload=dummy"), "basicAuth")).rejects.toThrow();

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

        it("should set payload as body", async () => {
            // act
            await expect(subject.postForm("http://test", new URLSearchParams("payload=dummy"))).rejects.toThrow();

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
            const result = await subject.postForm("http://test", new URLSearchParams("payload=dummy"));

            // assert
            expect(result).toEqual(json);
        });

        it("should reject promise when http response is error", async () => {
            // arrange
            mocked(fetch).mockRejectedValue(new Error("Network Error"));

            // act
            await expect(subject.postForm("http://test", new URLSearchParams("payload=dummy")))
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
            await expect(subject.postForm("http://test", new URLSearchParams("payload=dummy")))
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
            await expect(subject.postForm("http://test", new URLSearchParams("payload=dummy")))
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
            await expect(subject.postForm("http://test", new URLSearchParams("payload=dummy")))
                // assert
                .rejects.toThrow(ErrorResponse);
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
            await expect(subject.postForm("http://test", new URLSearchParams("payload=dummy")))
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
            await expect(subject.postForm("http://test", new URLSearchParams("payload=dummy")))
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
            await expect(subject.postForm("http://test", new URLSearchParams("payload=dummy")))
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
            await expect(subject.postForm("http://test", new URLSearchParams("payload=dummy")))
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
            const result = await subject.postForm("http://test", new URLSearchParams("payload=dummy"));

            // assert
            expect(result).toEqual(json);
        });
    });
});
