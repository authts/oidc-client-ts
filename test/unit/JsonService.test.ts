// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from '../../src/utils';
import { JsonService } from '../../src/JsonService';

class XMLHttpRequestMock {
    method: any;
    headers: Map<string, string>;
    url: any;

    responseHeaders: Map<string, string>;
    responseText?: string;
    status?: number;
    statusText?: string;

    constructor() {
        this.headers = new Map();
        this.responseHeaders = new Map();
        this.responseText = undefined;
        this.status = undefined;
        this.statusText = undefined;

        xmlHttpRequestMock = this;
    }

    open(method: string, url: string) {
        this.method = method;
        this.url = url;
    }

    setRequestHeader(header: string, value: string) {
        this.headers.set(header, value);
    }

    getResponseHeader(name: string) {
        return this.responseHeaders.get(name);
    }

    send(_body?: Document | BodyInit | null) {
    }
    onload(_ev: ProgressEvent) {
    }
    onerror(_ev: ProgressEvent) {
    }
}
let xmlHttpRequestMock = new XMLHttpRequestMock();

describe("JsonService", () => {
    let subject: JsonService;

    beforeEach(() =>{
        Log.logger = console;
        Log.level = Log.NONE;

        subject = new JsonService(null, XMLHttpRequestMock as unknown as typeof XMLHttpRequest);
    });

    describe("getJson", () => {

        it("should return a promise", () => {
            // act
            let p = subject.getJson("http://test");

            // assert
            expect(p).toBeInstanceOf(Promise);
        });

        it("should make GET request to url", () => {
            // act
            subject.getJson("http://test");

            // assert
            expect(xmlHttpRequestMock.method).toEqual('GET');
            expect(xmlHttpRequestMock.url).toEqual('http://test');
        });

        it("should set token as authorization header", () => {
            // act
            subject.getJson("http://test", "token");

            // assert
            expect(xmlHttpRequestMock.headers.has('Authorization')).toEqual(true);
            expect(xmlHttpRequestMock.headers.get('Authorization')).toEqual('Bearer token');
        });

        it("should fulfill promise when http response is 200", async () => {
            // act
            let p = subject.getJson("http://test");
            xmlHttpRequestMock.status = 200;
            xmlHttpRequestMock.responseHeaders.set('Content-Type', 'application/json');
            xmlHttpRequestMock.responseText = JSON.stringify({foo:1, bar:'test'});
            xmlHttpRequestMock.onload(new ProgressEvent("dummy"));
            let result = await p;

            // assert
            expect(result).not.toBeUndefined();
            expect(result.foo).toEqual(1);
            expect(result.bar).toEqual("test");
        });

        it("should reject promise when http response is not 200", async () => {
            // act
            let p = subject.getJson("http://test");
            xmlHttpRequestMock.status = 500;
            xmlHttpRequestMock.statusText = "server error";
            xmlHttpRequestMock.onload(new ProgressEvent("dummy"));
            try {
                await p;
                fail("should not come here");
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('500');
                expect(error.message).toContain('server error');
            }
        });

        it("should reject promise when http response is error", async () => {
            // act
            let p = subject.getJson("http://test");
            xmlHttpRequestMock.onerror(new ProgressEvent("dummy"));
            try {
                await p;
                fail("should not come here");
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toEqual("Network Error");
            }
        });

        it("should reject promise when http response content type is not json", async () => {
            // act
            let p = subject.getJson("http://test");
            xmlHttpRequestMock.status = 200;
            xmlHttpRequestMock.responseHeaders.set('Content-Type', 'text/html');
            xmlHttpRequestMock.responseText = JSON.stringify({foo:1, bar:'test'});
            xmlHttpRequestMock.onload(new ProgressEvent("dummy"));
            try {
                await p;
                fail("should not come here");
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain("Invalid response Content-Type: text/html");
            }
        });

        it("should accept custom content type in response", async () => {
            // arrange
            subject = new JsonService(['foo/bar'], XMLHttpRequestMock as unknown as typeof XMLHttpRequest);

            // act
            let p = subject.getJson("http://test");
            xmlHttpRequestMock.status = 200;
            xmlHttpRequestMock.responseHeaders.set('Content-Type', 'foo/bar');
            xmlHttpRequestMock.responseText = JSON.stringify({foo:1, bar:'test'});
            xmlHttpRequestMock.onload(new ProgressEvent("dummy"));
            let result = await p;

            // assert
            expect(result.foo).toEqual(1);
        });
    });
});
