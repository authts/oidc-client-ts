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

        it("should return a promise", async () => {
            // act
            const p = subject.getJson("http://test");

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should make GET request to url", async () => {
            // act
            const p = subject.getJson("http://test");

            // assert
            expect(fetchMock).toBeCalledWith("http://test", {
                headers: {},
                method: "GET"
            });
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should set token as authorization header", async () => {
            // act
            const p = subject.getJson("http://test", "token");

            // assert
            expect(fetchMock).toBeCalledWith("http://test", {
                headers: { Authorization: "Bearer token" },
                method: "GET"
            });
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
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

        it("should reject promise when http response is not 200", async () => {
            // arrange
            fetchMock.mockResolvedValue({
                status: 500,
                statusText: "server error"
            });

            // act
            try {
                await subject.getJson("http://test");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("500");
                expect((err as Error).message).toContain("server error");
            }
        });

        it("should reject promise when http response is error", async () => {
            // arrange
            fetchMock.mockRejectedValue({});

            // act
            try {
                await subject.getJson("http://test");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toEqual("Network Error");
            }
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
            try {
                await subject.getJson("http://test");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("Invalid response Content-Type: text/html");
            }
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
    });
});
