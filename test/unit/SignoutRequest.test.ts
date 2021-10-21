// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { SignoutRequest, SignoutRequestArgs } from "../../src/SignoutRequest";

describe("SignoutRequest", () => {

    let subject: SignoutRequest;
    let settings: SignoutRequestArgs;

    beforeEach(() => {
        settings = {
            url: "http://sts/signout",
            post_logout_redirect_uri: "loggedout",
            state_data: { data: "test" }
        };
        subject = new SignoutRequest(settings);
    });

    describe("constructor", () => {

        it("should require a url param", () => {
            // arrange
            delete (settings as any).url;

            // act
            try {
                new SignoutRequest(settings);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("url");
            }
        });
    });

    describe("url", () => {

        it("should include url", () => {
            // assert
            expect(subject.url.indexOf("http://sts/signout")).toEqual(0);
        });

        it("should include post_logout_redirect_uri", () => {
            // assert
            expect(subject.url).toContain("post_logout_redirect_uri=loggedout");
        });

        it("should include state if post_logout_redirect_uri provided", () => {
            // assert
            expect(subject.state).toBeDefined();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            expect(subject.url).toContain("state=" + subject.state!.id);
        });

        it("should not include state if no post_logout_redirect_uri provided", () => {
            // arrange
            delete settings.post_logout_redirect_uri;

            // act
            subject = new SignoutRequest(settings);

            // assert
            expect(subject.url).not.toContain("state=");
        });

        it("should include post_logout_redirect_uri, and state", () => {
            // assert
            const url = subject.url;
            expect(url.indexOf("http://sts/signout?")).toEqual(0);
            expect(url).toContain("post_logout_redirect_uri=loggedout");
            expect(subject.state).toBeDefined();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            expect(url).toContain("state=" + subject.state!.id);
        });

        it("should include extra query params", () => {
            // arrange
            settings.extraQueryParams = {
                "TargetResource": "logouturl.com",
                "InErrorResource": "errorurl.com"
            };

            // act
            subject = new SignoutRequest(settings);

            // assert
            expect(subject.url).toContain("TargetResource=logouturl.com&InErrorResource=errorurl.com");
        });

    });
});
