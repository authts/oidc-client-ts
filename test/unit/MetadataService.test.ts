// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from '../../src/utils';
import { MetadataService } from '../../src/MetadataService';
import { JsonService } from '../../src/JsonService';

describe("MetadataService", () => {
    let settings: any
    let subject: MetadataService;

    let jsonService: JsonService;

    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;

        settings = {};
        subject = new MetadataService(settings);

        // access private member
        jsonService = subject["_jsonService"];
    });

    describe("getMetadata", () => {
        it("should return a promise", async () => {
            // act
            const p = subject.getMetadata();

            // assert
            expect(p).toBeInstanceOf(Promise);
            try { await p; } catch {}
        });

        it("should use metadata on settings", async () => {
            // arrange
            settings = {
                metadata: "test",
            };
            subject = new MetadataService(settings);

            // act
            const result = await subject.getMetadata();

            // assert
            expect(result).toEqual("test");
        });

        it("should require metadataUrl", async () => {
            // act
            try {
                await subject.getMetadata();
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('metadataUrl');
            }
        });

        it("should use metadataUrl to make json call", async () => {
            // arrange
            settings.metadataUrl = "http://sts/metadata";
            const getJsonMock = jest.spyOn(jsonService, "getJson")
                .mockImplementation(() => Promise.resolve('test'));

            // act
            await subject.getMetadata();

            // assert
            expect(getJsonMock).toBeCalledWith("http://sts/metadata");
        });

        it("should return metadata from json call", async () => {
            // arrange
            settings.metadataUrl = "http://sts/metadata";
            const json = { "test": "data" };
            jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve(json));

            // act
            const result = await subject.getMetadata();

            // assert
            expect(result).toEqual(json);
        });

        it("should cache metadata from json call", async () => {
            // arrange
            settings.metadataUrl = "http://sts/metadata";
            const json = { test: "value" };
            jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve(json));

            // act
            await subject.getMetadata();

            // assert
            const _metadata = subject["_metadata"] // access private member
            expect(_metadata).toEqual(json);
        });

        it("should merge metadata from seed", async () => {
            // arrange
            settings.metadataUrl = "http://sts/metadata";
            settings.metadataSeed = {test1:"one"};
            jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve({test2:"two"}));

            // act
            const result = await subject.getMetadata();

            // assert
            expect(result).toEqual({test1:"one", test2:"two"});
            const _metadata = subject["_metadata"] // access private member
            expect(_metadata).toEqual({test1:"one", test2:"two"});
        });

        it("should fail if json call fails", async () => {
            // arrange
            settings.metadataUrl = "http://sts/metadata";
            jest.spyOn(jsonService, "getJson").mockRejectedValue(new Error("test"));

            // act
            try {
                await subject.getMetadata();
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("test");
            }
        });
    });

    describe("_getMetadataProperty", () => {

        it("should return a promise", async () => {
            // act
            var p = subject._getMetadataProperty("issuer");

            // assert
            expect(p).toBeInstanceOf(Promise);
            try { await p; } catch {}
        });

        it("should use metadata on settings", async () => {
            // arrange
            settings = {
                metadata: {
                    issuer: "test"
                },
            };
            subject = new MetadataService(settings);

            // act
            const result = await subject._getMetadataProperty("issuer");

            // assert
            expect(result).toEqual("test");
        });

        it("should fail if no data on metadata", async () => {
            // arrange
            settings = {
                metadata: {
                }
            };
            subject = new MetadataService(settings);

            // act
            try {
                await subject._getMetadataProperty("issuer");
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("issuer");
            }
        });

         it("should fail if json call to load metadata fails", async () => {
            // arrange
            settings.metadataUrl = "http://sts/metadata";
            jest.spyOn(jsonService, "getJson").mockRejectedValue(new Error("test"));

            // act
            try {
                await subject._getMetadataProperty("issuer");
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("test");
            }
        });
    });

    describe("getAuthorizationEndpoint", () => {

        it("should return value from metadata", async () => {
            // arrange
            settings = {
                metadata: {
                    authorization_endpoint: "http://sts/authorize"
                }
            };
            subject = new MetadataService(settings);

            // act
            const result = await subject.getAuthorizationEndpoint();

            // assert
            expect(result).toEqual("http://sts/authorize");
        });

    });

    describe("getUserInfoEndpoint", () => {

        it("should return value from", async () => {
            // arrange
            settings = {
                metadata: {
                    userinfo_endpoint: "http://sts/userinfo"
                }
            };
            subject = new MetadataService(settings);

            // act
            const result = await subject.getUserInfoEndpoint();

            // assert
            expect(result).toEqual("http://sts/userinfo");
        });

    });

    describe("getEndSessionEndpoint", () => {

        it("should return value from", async () => {
            // arrange
            settings = {
                metadata: {
                    end_session_endpoint: "http://sts/signout"
                }
            };
            subject = new MetadataService(settings);

            // act
            const result = await subject.getEndSessionEndpoint();

            // assert
            expect(result).toEqual("http://sts/signout");
        });

        it("should support optional value", async () => {
            // arrange
            settings = {
                metadata: {
                }
            };
            subject = new MetadataService(settings);

            // act
            const result = await subject.getEndSessionEndpoint();

            // assert
            expect(result).toBeUndefined();
        });

    });

    describe("getCheckSessionIframe", () => {

        it("should return value from", async () => {
            // arrange
            settings = {
                metadata: {
                    check_session_iframe: "http://sts/check_session"
                }
            };
            subject = new MetadataService(settings);

            // act
            const result = await subject.getCheckSessionIframe();

            // assert
            expect(result).toEqual("http://sts/check_session");
        });

        it("should support optional value", async () => {
            // arrange
            settings = {
                metadata: {
                }
            };
            subject = new MetadataService(settings);

            // act
            const result = await subject.getCheckSessionIframe();

            // assert
            expect(result).toBeUndefined();
        });

    });

    describe("getIssuer", () => {

        it("should return value from", async () => {
            // arrange
            settings = {
                metadata: {
                    issuer: "http://sts"
                }
            };
            subject = new MetadataService(settings);

            // act
            const result = await subject.getIssuer();

            // assert
            expect(result).toEqual("http://sts");
        });

    });

    describe("getSigningKeys", () => {

        it("should return a promise", async () => {
            // act
            var p = subject.getSigningKeys();

            // assert
            expect(p).toBeInstanceOf(Promise);
            try { await p; } catch {}
        });

        it("should use signingKeys on settings", async () => {
            // arrange
            settings = {
                signingKeys: "test"
            };
            subject = new MetadataService(settings);

            // act
            const result = await subject.getSigningKeys();

            // assert
            expect(result).toEqual("test");
        });

        it("should fail if metadata does not have jwks_uri", async () => {
            // arrange
            settings = {
                metadata: "test"
            };
            subject = new MetadataService(settings);

            // act
            try {
                await subject.getSigningKeys();
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('jwks_uri');
            }
        });

        it("should fail if keys missing on keyset from jwks_uri", async () => {
            // arrange
            settings = {
                metadata: {
                    jwks_uri: "http://sts/metadata/keys"
                }
            };
            subject = new MetadataService(settings);
            jsonService = subject["_jsonService"]; // access private member
            jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve({}));

            // act
            try {
                await subject.getSigningKeys();
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('keyset');
            }
        });

        it("should make json call to jwks_uri", async () => {
            // arrange
            settings = {
                metadata: {
                    jwks_uri: "http://sts/metadata/keys"
                }
            };
            subject = new MetadataService(settings);
            jsonService = subject["_jsonService"]; // access private member
            const json = {
                keys: [{
                    use:'sig',
                    kid:"test"
                }]
            };
            const getJsonMock = jest.spyOn(jsonService, "getJson")
                .mockImplementation(() => Promise.resolve(json));

            // act
            await subject.getSigningKeys();

            // assert
            expect(getJsonMock).toBeCalledWith("http://sts/metadata/keys");
        });

        it("should return keys from jwks_uri", async () => {
            // arrange
            settings = {
                metadata: {
                    jwks_uri: "http://sts/metadata/keys"
                }
            };
            subject = new MetadataService(settings);
            jsonService = subject["_jsonService"]; // access private member
            const expectedKeys = [{
                use:'sig',
                kid:"test"
            }];
            const json = {
                keys: expectedKeys
            };
            jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve(json));

            // act
            const result = await subject.getSigningKeys();

            // assert
            expect(result).toEqual(expectedKeys);
        });

        it("should cache keys from json call", async () => {
            // arrange
            settings = {
                metadata: {
                    jwks_uri: "http://sts/metadata/keys"
                }
            };
            subject = new MetadataService(settings);
            jsonService = subject["_jsonService"]; // access private member
            const expectedKeys = [{
                use:'sig',
                kid:"test"
            }];
            const json = {
                keys: expectedKeys
            };
            jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve(json));

            // act
            await subject.getSigningKeys();

            // assert
            const _signingKeys = subject["_signingKeys"] // access private member
            expect(_signingKeys).toEqual(expectedKeys);
        });
    });
});
