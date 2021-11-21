// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../../src/utils";
import { JsonService } from "../../src/JsonService";

describe("JsonService", () => {
    let subject: JsonService;
    let fetchMock: jest.Mock<any, any>;

    beforeEach(() =>{
        Log.logger = console;
        Log.level = Log.NONE;

        fetchMock = jest.fn();
        global.fetch = fetchMock;

        subject = new JsonService();
    });

    describe("getJson", () => {
        it("should reject promise when no url is passed", async () => {
            // act
            await expect(subject.getJson(""))
                // assert
                .rejects.toThrow("url");
        });

        it("should make GET request to url", async () => {
            // act
            await expect(subject.getJson("http://test")).rejects.toThrow();

            // assert
            expect(fetchMock).toBeCalledWith("http://test", {
                headers: {},
                method: "GET"
            });
        });

        it("should set token as authorization header", async () => {
            // act
            await expect(subject.getJson("http://test", "token")).rejects.toThrow();

            // assert
            expect(fetchMock).toBeCalledWith("http://test", {
                headers: { Authorization: "Bearer token" },
                method: "GET"
            });
        });

        it("should fulfill promise when http response is 200", async () => {
            // arrange
            const json = { foo: 1, bar: "test" };
            fetchMock.mockResolvedValue({
                status: 200,
                headers: new Headers({
                    "Content-Type": "application/json"
                }),
                json: () => Promise.resolve(json)
            });

            // act
            const result = await subject.getJson("http://test");

            // assert
            expect(result).toEqual(json);
        });

        it("should reject promise when http response is 200 and json is not able to parse", async () => {
            // arrange
            const error = new SyntaxError("Unexpected token a in JSON");
            fetchMock.mockResolvedValue({
                status: 200,
                headers: new Headers({
                    "Content-Type": "application/json"
                }),
                json: () => Promise.reject(error)
            });

            // act
            await expect(subject.getJson("http://test"))
                // assert
                .rejects.toThrow(error);
        });

        it("should reject promise when http response is not 200", async () => {
            // arrange
            fetchMock.mockResolvedValue({
                status: 500,
                statusText: "server error"
            });

            // act
            await expect(subject.getJson("http://test"))
                // assert
                .rejects.toThrow(/server error.+500/);
        });

        it("should reject promise when http response is error", async () => {
            // arrange
            fetchMock.mockRejectedValue({});

            // act
            await expect(subject.getJson("http://test"))
                // assert
                .rejects.toThrow("Network Error");
        });

        it("should reject promise when http response content type is not json", async () => {
            // arrange
            const json = { foo: 1, bar: "test" };
            fetchMock.mockResolvedValue({
                status: 200,
                headers: new Headers({
                    "Content-Type": "text/html"
                }),
                json: () => Promise.resolve(json)
            });

            // act
            await expect(subject.getJson("http://test"))
                // assert
                .rejects.toThrow("Invalid response Content-Type: text/html");
        });

        it("should accept custom content type in response", async () => {
            // arrange
            subject = new JsonService(["foo/bar"]);
            const json = { foo: 1, bar: "test" };
            fetchMock.mockResolvedValue({
                status: 200,
                headers: new Headers({
                    "Content-Type": "foo/bar"
                }),
                json: () => Promise.resolve(json)
            });

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
            fetchMock.mockResolvedValue({
                status: 200,
                headers: new Headers({
                    "Content-Type": "application/jwt"
                }),
                text: () => Promise.resolve(text)
            });

            // act
            await subject.getJson("http://test");

            // assert
            expect(jwtHandler).toBeCalledWith(text);
        });
    });

    describe("postForm", () => {
        it("should reject promise when no url is passed", async () => {
            // act
            await expect(subject.postForm("", { "a": "b" }))
                // assert
                .rejects.toThrow("url");
        });

        it("should make POST request to url", async () => {
            // act
            await expect(subject.postForm("http://test", { "a": "b" })).rejects.toThrow();

            // assert
            expect(fetchMock).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    method: "POST",
                    body: new URLSearchParams()
                })
            );
        });

        it("should set basicAuth as authorization header", async () => {
            // act
            await expect(subject.postForm("http://test", { "payload": "dummy" }, "basicAuth")).rejects.toThrow();

            // assert
            expect(fetchMock).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        Authorization: "Basic " + btoa("basicAuth"),
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    method: "POST",
                    body: new URLSearchParams()
                })
            );
        });

        it("should set payload as body", async () => {
            // act
            await expect(subject.postForm("http://test", { "payload": "dummy" })).rejects.toThrow();

            // assert
            const body = new URLSearchParams();
            body.set("payload", "dummy");

            expect(fetchMock).toBeCalledWith(
                "http://test",
                expect.objectContaining({
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    method: "POST",
                    body
                })
            );
        });

        it("should fulfill promise when http response is 200", async () => {
            // arrange
            const json = { foo: 1, bar: "test" };
            fetchMock.mockResolvedValue({
                status: 200,
                headers: new Headers({
                    "Content-Type": "application/json"
                }),
                json: () => Promise.resolve(json)
            });

            // act
            const result = await subject.postForm("http://test", { "payload": "dummy" });

            // assert
            expect(result).toEqual(json);
        });

        it("should reject promise when http response is error", async () => {
            // arrange
            fetchMock.mockRejectedValue({});

            // act
            await expect(subject.postForm("http://test", { "payload": "dummy" }))
                // assert
                .rejects.toThrow("Network Error");
        });

        it("should reject promise when http response is 200 and json is not able to parse", async () => {
            // arrange
            const error = new SyntaxError("Unexpected token a in JSON");
            fetchMock.mockResolvedValue({
                status: 200,
                headers: new Headers({
                    "Content-Type": "application/json"
                }),
                json: () => Promise.reject(error)
            });

            // act
            await expect(subject.postForm("http://test", { "payload": "dummy" }))
                // assert
                .rejects.toThrow(error);
        });

        it("should reject promise when http response is 200 and content type is not json", async () => {
            // arrange
            const json = { foo: 1, bar: "test" };
            fetchMock.mockResolvedValue({
                status: 200,
                headers: new Headers({
                    "Content-Type": "text/html"
                }),
                json: () => Promise.resolve(json)
            });

            // act
            await expect(subject.postForm("http://test", { "payload": "dummy" }))
                // assert
                .rejects.toThrow("Invalid response Content-Type: text/html");
        });

        it("should reject promise when http response is 400 and json has error field", async () => {
            // arrange
            const json = { error: "error" };
            fetchMock.mockResolvedValue({
                status: 400,
                headers: new Headers({
                    "Content-Type": "application/json"
                }),
                json: () => Promise.resolve(json)
            });

            // act
            await expect(subject.postForm("http://test", { "payload": "dummy" }))
                // assert
                .rejects.toThrow(json.error);
        });

        it("should fulfill promise when http response is 400 and json has no error field", async () => {
            // arrange
            const json = { foo: 1, bar: "test" };
            fetchMock.mockResolvedValue({
                status: 400,
                headers: new Headers({
                    "Content-Type": "application/json"
                }),
                json: () => Promise.resolve(json)
            });

            // act
            const result = await subject.postForm("http://test", { "payload": "dummy" });

            // assert
            expect(result).toEqual(json);
        });

        it("should reject promise when http response is 400 and json is not able to parse", async () => {
            // arrange
            const error = new SyntaxError("Unexpected token a in JSON");
            fetchMock.mockResolvedValue({
                status: 400,
                headers: new Headers({
                    "Content-Type": "application/json"
                }),
                json: () => Promise.reject(error)
            });

            // act
            await expect(subject.postForm("http://test", { "payload": "dummy" }))
                // assert
                .rejects.toThrow(error);
        });

        it("should reject promise when http response is 400 and content type is not json", async () => {
            // arrange
            const json = { foo: 1, bar: "test" };
            fetchMock.mockResolvedValue({
                status: 400,
                headers: new Headers({
                    "Content-Type": "text/html"
                }),
                json: () => Promise.resolve(json)
            });

            // act
            await expect(subject.postForm("http://test", { "payload": "dummy" }))
                // assert
                .rejects.toThrow("Invalid response Content-Type: text/html");
        });

        it("should reject promise when http response is not 200", async () => {
            // arrange
            fetchMock.mockResolvedValue({
                status: 500,
                statusText: "server error",
            });

            // act
            await expect(subject.postForm("http://test", { "payload": "dummy" }))
                // assert
                .rejects.toThrow(/server error.+500/);
        });

        it("should accept custom content type in response", async () => {
            // arrange
            subject = new JsonService(["foo/bar"]);
            const json = { foo: 1, bar: "test" };
            fetchMock.mockResolvedValue({
                status: 200,
                headers: new Headers({
                    "Content-Type": "foo/bar"
                }),
                json: () => Promise.resolve(json)
            });

            // act
            const result = await subject.postForm("http://test", { "payload": "dummy" });

            // assert
            expect(result).toEqual(json);
        });
    });
});
