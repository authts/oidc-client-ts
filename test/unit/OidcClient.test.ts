// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../../src/utils";
import { OidcClient } from "../../src/OidcClient";
import { OidcClientSettings, OidcClientSettingsStore } from "../../src/OidcClientSettings";
import { SigninState } from "../../src/SigninState";
import { State } from "../../src/State";
import { SigninRequest } from "../../src/SigninRequest";
import { SignoutRequest } from "../../src/SignoutRequest";
import { SignoutResponse } from "../../src/SignoutResponse";
import { ErrorResponse } from "../../src/ErrorResponse";

describe("OidcClient", () => {
    let subject: OidcClient;

    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;

        // restore spyOn
        jest.restoreAllMocks();

        const settings: OidcClientSettings = {
            authority: "authority",
            client_id: "client",
            redirect_uri: "redirect",
            post_logout_redirect_uri: "http://app"
        };
        subject = new OidcClient(settings);
    });

    describe("constructor", () => {
        it("should expose settings", () => {
            // assert
            expect(subject.settings).not.toBeNull();
            expect(subject.settings.client_id).toEqual("client");
        });
    });

    describe("settings", () => {

        it("should be OidcClientSettings", () => {
            // assert
            expect(subject.settings).toBeInstanceOf(OidcClientSettingsStore);
        });
    });

    describe("createSigninRequest", () => {

        it("should return a promise", async () => {
            // arrange
            const args = {
                redirect_uri: "redirect",
                response_type: "response",
                scope: "scope"
            };
            jest.spyOn(subject.metadataService, "getAuthorizationEndpoint").mockImplementation(() => Promise.resolve("http://sts/authorize"));

            // act
            const p = subject.createSigninRequest(args);

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should return SigninRequest", async () => {
            // arrange
            const args = {
                redirect_uri: "redirect",
                response_type: "response",
                scope: "scope"
            };
            jest.spyOn(subject.metadataService, "getAuthorizationEndpoint").mockImplementation(() => Promise.resolve("http://sts/authorize"));

            // act
            const request = await subject.createSigninRequest(args);

            // assert
            expect(request).toBeInstanceOf(SigninRequest);
        });

        it("should pass params to SigninRequest", async () => {
            // arrange
            jest.spyOn(subject.metadataService, "getAuthorizationEndpoint").mockImplementation(() => Promise.resolve("http://sts/authorize"));

            // act
            const request = await subject.createSigninRequest({
                data: "foo",
                response_type: "bar",
                response_mode: "mode",
                scope: "baz",
                redirect_uri: "quux",
                prompt: "p",
                display: "d",
                max_age: 42,
                ui_locales: "u",
                id_token_hint: "ith",
                login_hint: "lh",
                acr_values: "av",
                resource: "res",
                request: "req",
                request_uri: "req_uri"
            });

            // assert
            expect(request.state.data).toEqual("foo");
            const url = request.url;
            expect(url).toContain("http://sts/authorize");
            expect(url).toContain("response_type=bar");
            expect(url).toContain("scope=baz");
            expect(url).toContain("redirect_uri=quux");
            expect(url).toContain("prompt=p");
            expect(url).toContain("display=d");
            expect(url).toContain("max_age=42");
            expect(url).toContain("ui_locales=u");
            expect(url).toContain("id_token_hint=ith");
            expect(url).toContain("login_hint=lh");
            expect(url).toContain("acr_values=av");
            expect(url).toContain("resource=res");
            expect(url).toContain("request=req");
            expect(url).toContain("request_uri=req_uri");
            expect(url).toContain("response_mode=mode");
        });

        it("should pass state in place of data to SigninRequest", async () => {
            // arrange
            jest.spyOn(subject.metadataService, "getAuthorizationEndpoint").mockImplementation(() => Promise.resolve("http://sts/authorize"));

            // act
            const request = await subject.createSigninRequest({
                state: "foo",
                response_type: "bar",
                scope: "baz",
                redirect_uri: "quux",
                prompt: "p",
                display: "d",
                max_age: 42,
                ui_locales: "u",
                id_token_hint: "ith",
                login_hint: "lh",
                acr_values: "av",
                resource: "res"
            });

            // assert
            expect(request.state.data).toEqual("foo");
            const url = request.url;
            expect(url).toContain("http://sts/authorize");
            expect(url).toContain("response_type=bar");
            expect(url).toContain("scope=baz");
            expect(url).toContain("redirect_uri=quux");
            expect(url).toContain("prompt=p");
            expect(url).toContain("display=d");
            expect(url).toContain("max_age=42");
            expect(url).toContain("ui_locales=u");
            expect(url).toContain("id_token_hint=ith");
            expect(url).toContain("login_hint=lh");
            expect(url).toContain("acr_values=av");
            expect(url).toContain("resource=res");
        });

        it("should fail if hybrid code id_token requested", async () => {
            // arrange
            const args = {
                redirect_uri: "redirect",
                scope: "scope",
                response_type: "code id_token"
            };

            // act
            try {
                await subject.createSigninRequest(args);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("hybrid");
            }
        });

        it("should fail if hybrid code token requested", async () => {
            // arrange
            const args = {
                redirect_uri: "redirect",
                scope: "scope",
                response_type: "code token"
            };

            // act
            try {
                await subject.createSigninRequest(args);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("hybrid");
            }
        });

        it("should fail if hybrid code id_token token requested", async () => {
            // arrange
            const args = {
                redirect_uri: "redirect",
                scope: "scope",
                response_type: "code id_token token"
            };

            // act
            try {
                await subject.createSigninRequest(args);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("hybrid");
            }
        });

        it("should fail if metadata fails", async () => {
            // arrange
            const args = {
                redirect_uri: "redirect",
                response_type: "response",
                scope: "scope"
            };
            jest.spyOn(subject.metadataService, "getAuthorizationEndpoint").mockRejectedValue(new Error("test"));

            // act
            try {
                await subject.createSigninRequest(args);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("test");
            }
        });

        it("should fail if seting state into store fails", async () => {
            // arrange
            const args = {
                redirect_uri: "redirect",
                response_type: "response",
                scope: "scope"
            };
            jest.spyOn(subject.metadataService, "getAuthorizationEndpoint").mockImplementation(() => Promise.resolve("http://sts/authorize"));
            jest.spyOn(subject.settings.stateStore, "set").mockRejectedValue(new Error("foo"));

            // act
            try {
                await subject.createSigninRequest(args);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("foo");
            }
        });

        it("should store state", async () => {
            // arrange
            const args = {
                redirect_uri: "redirect",
                response_type: "response",
                scope: "scope"
            };
            jest.spyOn(subject.metadataService, "getAuthorizationEndpoint").mockImplementation(() => Promise.resolve("http://sts/authorize"));
            const setMock = jest.spyOn(subject.settings.stateStore, "set").mockImplementation(() => Promise.resolve());

            // act
            await subject.createSigninRequest(args);

            // assert
            expect(setMock).toBeCalled();
        });
    });

    describe("readSigninResponseState", () => {

        it("should return a promise", async () => {
            // act
            const p = subject.readSigninResponseState("state=state");

            // asssert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should fail if no state on response", async () => {
            // arrange
            jest.spyOn(subject.settings.stateStore, "get").mockImplementation(() => Promise.resolve("state"));

            // act
            try {
                await subject.readSigninResponseState("");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("state");
            }
        });

        it("should fail if storage fails", async () => {
            // arrange
            jest.spyOn(subject.settings.stateStore, "get").mockRejectedValue(new Error("fail"));

            // act
            try {
                await subject.readSigninResponseState("state=state");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("fail");
            }
        });

        it("should deserialize stored state and return state and response", async () => {
            // arrange
            const item = new SigninState({
                id: "1",
                nonce: "2",
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type"
            }).toStorageString();
            jest.spyOn(subject.settings.stateStore, "get").mockImplementation(() => Promise.resolve(item));

            // act
            const { state, response } = await subject.readSigninResponseState("state=1");

            // assert
            expect(state.id).toEqual("1");
            expect(state.nonce).toEqual("2");
            expect(state.authority).toEqual("authority");
            expect(state.client_id).toEqual("client");
            expect(state.request_type).toEqual("type");
            expect(response.state).toEqual("1");
        });
    });

    describe("processSigninResponse", () => {
        it("should return a promise", async () => {
            // act
            const p = subject.processSigninResponse("state=state");

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should fail if no state on response", async () => {
            // arrange
            jest.spyOn(subject.settings.stateStore, "get").mockImplementation(() => Promise.resolve("state"));

            // act
            try {
                await subject.processSigninResponse("");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("state");
            }
        });

        it("should fail if storage fails", async () => {
            // arrange
            jest.spyOn(subject.settings.stateStore, "remove").mockRejectedValue(new Error("fail"));

            // act
            try {
                await subject.processSigninResponse("state=state");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("fail");
            }
        });

        it("should deserialize stored state and call validator", async () => {
            // arrange
            const item = new SigninState({
                id: "1",
                nonce: "2",
                authority: "authority",
                client_id:"client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type"
            });
            jest.spyOn(subject.settings.stateStore, "remove")
                .mockImplementation(() => Promise.resolve(item.toStorageString()));
            const validateSigninResponseMock = jest.spyOn(subject["_validator"], "validateSigninResponse")
                .mockImplementation((_s, r) => Promise.resolve(r));

            // act
            const response = await subject.processSigninResponse("state=1");

            // assert
            expect(validateSigninResponseMock).toBeCalledWith(item, response);
        });
    });

    describe("createSignoutRequest", () => {

        it("should return a promise", async () => {
            // arrange
            jest.spyOn(subject.metadataService, "getEndSessionEndpoint").mockImplementation(() => Promise.resolve("http://sts/signout"));

            // act
            const p = subject.createSignoutRequest();

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should return SignoutRequest", async () => {
            // arrange
            jest.spyOn(subject.metadataService, "getEndSessionEndpoint").mockImplementation(() => Promise.resolve("http://sts/signout"));

            // act
            const request = await subject.createSignoutRequest();

            // assert
            expect(request).toBeInstanceOf(SignoutRequest);
        });

        it("should pass state in place of data to SignoutRequest", async () => {
            // arrange
            jest.spyOn(subject.metadataService, "getEndSessionEndpoint").mockImplementation(() => Promise.resolve("http://sts/signout"));

            // act
            const request = await subject.createSignoutRequest({
                state: "foo",
                post_logout_redirect_uri: "bar",
                id_token_hint: "baz"
            });

            // assert
            expect(request.state).toBeDefined();
            expect(request.state?.data).toEqual("foo");
            const url = request.url;
            expect(url).toContain("http://sts/signout");
            expect(url).toContain("post_logout_redirect_uri=bar");
            expect(url).toContain("id_token_hint=baz");
        });

        it("should pass params to SignoutRequest", async () => {
            // arrange
            jest.spyOn(subject.metadataService, "getEndSessionEndpoint").mockImplementation(() => Promise.resolve("http://sts/signout"));

            // act
            const request = await subject.createSignoutRequest({
                data: "foo",
                post_logout_redirect_uri: "bar",
                id_token_hint: "baz"
            });

            // assert
            expect(request.state).toBeDefined();
            expect(request.state?.data).toEqual("foo");
            const url = request.url;
            expect(url).toContain("http://sts/signout");
            expect(url).toContain("post_logout_redirect_uri=bar");
            expect(url).toContain("id_token_hint=baz");
        });

        it("should fail if metadata fails", async () => {
            // arrange
            jest.spyOn(subject.metadataService, "getEndSessionEndpoint").mockRejectedValue(new Error("test"));

            // act
            try {
                await subject.createSignoutRequest();
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("test");
            }
        });

        it("should fail if no signout endpoint on metadata", async () => {
            // arrange
            jest.spyOn(subject.metadataService, "getEndSessionEndpoint").mockImplementation(() => Promise.resolve(undefined));

            // act
            try {
                await subject.createSignoutRequest();
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("no end session endpoint");
            }
        });

        it("should store state", async () => {
            // arrange
            jest.spyOn(subject.metadataService, "getEndSessionEndpoint").mockImplementation(() => Promise.resolve("http://sts/signout"));
            const setMock = jest.spyOn(subject.settings.stateStore, "set").mockImplementation(() => Promise.resolve());

            // act
            await subject.createSignoutRequest({
                data:"foo", id_token_hint:"hint"
            });

            // assert
            expect(setMock).toBeCalled();
        });

        it("should not generate state if no data", async () => {
            // arrange
            jest.spyOn(subject.metadataService, "getEndSessionEndpoint").mockImplementation(() => Promise.resolve("http://sts/signout"));
            const setMock = jest.spyOn(subject.settings.stateStore, "set").mockImplementation(() => Promise.resolve());

            // act
            await subject.createSignoutRequest();

            // assert
            expect(setMock).not.toBeCalled();
        });
    });

    describe("readSignoutResponseState", () => {
        it("should return a promise", async () => {
            // act
            const p = subject.readSignoutResponseState("state=state");

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should return result if no state on response", async () => {
            // act
            const { response } = await subject.readSignoutResponseState("");

            // assert
            expect(response).toBeInstanceOf(SignoutResponse);
        });

        it("should return error", async () => {
            // act
            try {
                await subject.readSignoutResponseState("error=foo");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as ErrorResponse).error).toEqual("foo");
            }
        });

        it("should fail if storage fails", async () => {
            // arrange
            jest.spyOn(subject.settings.stateStore, "get").mockRejectedValue(new Error("fail"));

            // act
            try {
                await subject.readSignoutResponseState("state=state");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("fail");
            }
        });

        it("should deserialize stored state and return state and response", async () => {
            // arrange
            const item = new State({ id: "1", request_type:"type" }).toStorageString();
            jest.spyOn(subject.settings.stateStore, "get").mockImplementation(() => Promise.resolve(item));

            // act
            const { state, response } = await subject.readSignoutResponseState("state=1");

            // assert
            expect(state).toBeDefined();
            expect(state?.id).toEqual("1");
            expect(state?.request_type).toEqual("type");
            expect(response.state).toEqual("1");
        });

        it("should call validator with state even if error in response", async () => {
            // arrange
            const item = new State({
                id: "1",
                data: "bar",
                request_type: "type"
            });
            jest.spyOn(subject.settings.stateStore, "remove")
                .mockImplementation(() => Promise.resolve(item.toStorageString()));
            const validateSignoutResponse = jest.spyOn(subject["_validator"], "validateSignoutResponse")
                .mockImplementation((_s, r) => r);

            // act
            const response = await subject.processSignoutResponse("state=1&error=foo");

            // assert
            expect(validateSignoutResponse).toBeCalledWith(item, response);
        });
    });

    describe("processSignoutResponse", () => {
        it("should return a promise", async () => {
            // act
            const p = subject.processSignoutResponse("state=state");

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should return result if no state on response", async () => {
            // act
            const response = await subject.processSignoutResponse("");

            // assert
            expect(response).toBeInstanceOf(SignoutResponse);
        });

        it("should return error", async () => {
            // act
            try {
                await subject.processSignoutResponse("error=foo");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as ErrorResponse).error).toEqual("foo");
            }
        });

        it("should fail if storage fails", async () => {
            // arrange
            jest.spyOn(subject.settings.stateStore, "remove").mockRejectedValue(new Error("fail"));

            // act
            try {
                await subject.processSignoutResponse("state=state");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("fail");
            }
        });

        it("should deserialize stored state and call validator", async () => {
            // arrange
            const item = new State({
                id: "1",
                request_type: "type"
            });
            jest.spyOn(subject.settings.stateStore, "remove")
                .mockImplementation(() => Promise.resolve(item.toStorageString()));
            const validateSignoutResponse = jest.spyOn(subject["_validator"], "validateSignoutResponse")
                .mockImplementation((_s, r) => r);

            // act
            const response = await subject.processSignoutResponse("state=1");

            // assert
            expect(validateSignoutResponse).toBeCalledWith(item, response);
        });

        it("should call validator with state even if error in response", async () => {
            // arrange
            const item = new State({
                id: "1",
                data:"bar",
                request_type: "type"
            });
            jest.spyOn(subject.settings.stateStore, "remove")
                .mockImplementation(() => Promise.resolve(item.toStorageString()));
            const validateSignoutResponse = jest.spyOn(subject["_validator"], "validateSignoutResponse")
                .mockImplementation((_s, r) => r);

            // act
            const response = await subject.processSignoutResponse("state=1&error=foo");

            // assert
            expect(validateSignoutResponse).toBeCalledWith(item, response);
        });
    });

    describe("clearStaleState", () => {

        it("should return a promise", async () => {
            // act
            const p = subject.clearStaleState();

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should call State.clearStaleState", async () => {
            // arrange
            const clearStaleState = jest.spyOn(State, "clearStaleState");

            // act
            await subject.clearStaleState();

            // assert
            expect(clearStaleState).toBeCalled();
        });
    });
});
