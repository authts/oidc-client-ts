// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from '../../src/Log';
import { OidcClient } from '../../src/OidcClient';
import { OidcClientSettingsStore } from '../../src/OidcClientSettings';
import { SigninState } from '../../src/SigninState';
import { State } from '../../src/State';
import { SigninRequest } from '../../src/SigninRequest';
import { SignoutRequest } from '../../src/SignoutRequest';
import { SignoutResponse } from '../../src/SignoutResponse';

import { StubStateStore } from './StubStateStore';
import { StubResponseValidator } from './StubResponseValidator';
import { StubMetadataService } from './StubMetadataService';

// workaround jest parse error
jest.mock('../../jsrsasign/dist/jsrsasign.js', () => {
    return {
        jws: jest.fn(),
        KEYUTIL: jest.fn(),
        X509: jest.fn(),
        crypto: jest.fn(),
        hextob64u: jest.fn(),
        b64tohex: jest.fn()
    };
});

describe("OidcClient", () => {
    let stubStore: any;
    let stubResponseValidator: StubResponseValidator;
    let stubMetadataService: StubMetadataService;
    let settings: any;
    let subject: OidcClient;

    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;

        stubStore = new StubStateStore();
        stubResponseValidator = new StubResponseValidator();
        stubMetadataService = new StubMetadataService();

        settings = {
            authority: 'authority',
            client_id: 'client',
            redirect_uri: "http://app",
            post_logout_redirect_uri: "http://app",
            stateStore: stubStore,
            ResponseValidatorCtor: () => stubResponseValidator,
            MetadataServiceCtor: () => stubMetadataService
        };
        subject = new OidcClient(settings);
    });

    describe("constructor", () => {

        it("should allow no settings", () => {
            // act
            new OidcClient();
        });

        it("should expose settings", () => {
            // assert
            expect(subject.settings).not.toBeNull();
            expect(subject.settings.client_id).toEqual("client");
        });

        it("should accept OidcClientSettings", () => {
            // arrange
            let settings = {
                client_id: "client"
            };

            // act
            new OidcClient(settings);
        });
    });

    describe("settings", () => {

        it("should be OidcClientSettings", () => {
            // assert
            expect(subject.settings).toBeInstanceOf(OidcClientSettingsStore);
        });

    });

    describe("metadataService", () => {

        it("should be MetadataService", () => {
            // assert
            expect(subject.metadataService).toEqual(stubMetadataService);
        });

    });

    describe("createSigninRequest", () => {

        it("should return a promise", async () => {
            // arrange
            stubMetadataService.getAuthorizationEndpointResult = Promise.resolve("http://sts/authorize");

            // act
            var p = subject.createSigninRequest();

            // assert
            expect(p).toBeInstanceOf(Promise);
            try { await p; } catch(_err) {}
        });

        it("should return SigninRequest", async () => {
            // arrange
            stubMetadataService.getAuthorizationEndpointResult = Promise.resolve("http://sts/authorize");

            // act
            var request = await subject.createSigninRequest();

            // assert
            expect(request).toBeInstanceOf(SigninRequest);
        });

        it("should pass params to SigninRequest", async () => {
            // arrange
            stubMetadataService.getAuthorizationEndpointResult = Promise.resolve("http://sts/authorize");

            // act
            var request = await subject.createSigninRequest({
                data: 'foo',
                response_type: 'bar',
                response_mode: 'mode',
                scope: 'baz',
                redirect_uri: 'quux',
                prompt: 'p',
                display: 'd',
                max_age: 'm',
                ui_locales: 'u',
                id_token_hint: 'ith',
                login_hint: 'lh',
                acr_values: 'av',
                resource: 'res',
                request: 'req',
                request_uri: 'req_uri'
            });

            // assert
            expect(request.state.data).toEqual('foo');
            const url = request.url;
            expect(url).toContain("http://sts/authorize");
            expect(url).toContain("response_type=bar");
            expect(url).toContain("scope=baz");
            expect(url).toContain("redirect_uri=quux");
            expect(url).toContain("prompt=p");
            expect(url).toContain("display=d");
            expect(url).toContain("max_age=m");
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
            stubMetadataService.getAuthorizationEndpointResult = Promise.resolve("http://sts/authorize");

            // act
            var request = await subject.createSigninRequest({
                state: 'foo',
                response_type: 'bar',
                scope: 'baz',
                redirect_uri: 'quux',
                prompt: 'p',
                display: 'd',
                max_age: 'm',
                ui_locales: 'u',
                id_token_hint: 'ith',
                login_hint: 'lh',
                acr_values: 'av',
                resource: 'res'
            });

            // assert
            expect(request.state.data).toEqual('foo');
            const url = request.url;
            expect(url).toContain("http://sts/authorize");
            expect(url).toContain("response_type=bar");
            expect(url).toContain("scope=baz");
            expect(url).toContain("redirect_uri=quux");
            expect(url).toContain("prompt=p");
            expect(url).toContain("display=d");
            expect(url).toContain("max_age=m");
            expect(url).toContain("ui_locales=u");
            expect(url).toContain("id_token_hint=ith");
            expect(url).toContain("login_hint=lh");
            expect(url).toContain("acr_values=av");
            expect(url).toContain("resource=res");
        });

        it("should fail if hybrid code id_token requested", async () => {
            // act
            try {
                await subject.createSigninRequest({response_type:"code id_token"});
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("hybrid");
            }
        });

        it("should fail if hybrid code token requested", async () => {
            // act
            try {
                await subject.createSigninRequest({response_type:"code token"});
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("hybrid");
            }
        });

        it("should fail if hybrid code id_token token requested", async () => {
            // act
            try {
                await subject.createSigninRequest({response_type:"code id_token token"});
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("hybrid");
            }
        });

        it("should fail if metadata fails", async () => {
            // arrange
            stubMetadataService.getAuthorizationEndpointResult = Promise.reject(new Error("test"));

            // act
            try {
                await subject.createSigninRequest();
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("test");
            }
        });

        it("should fail if seting state into store fails", async () => {
            // arrange
            stubMetadataService.getAuthorizationEndpointResult = Promise.resolve("http://sts/authorize");
            stubStore.error = "foo";

            // act
            try {
                await subject.createSigninRequest();
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("foo");
            }
        });

        it("should store state", async () => {
            // arrange
            stubMetadataService.getAuthorizationEndpointResult = Promise.resolve("http://sts/authorize");

            // act
            await subject.createSigninRequest();

            // assert
            expect(stubStore.item).toBeDefined();
        });
    });

    describe("readSigninResponseState", () => {

        it("should return a promise", async () => {
            // act
            var p = subject.readSigninResponseState("state=state");

            // asssert
            expect(p).toBeInstanceOf(Promise);
            try { await p; } catch(_err) {}
        });

        it("should fail if no state on response", async () => {
            // arrange
            stubStore.item = "state";

            // act
            try {
                await subject.readSigninResponseState("");
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('state');
            }
        });

        it("should fail if storage fails", async () => {
            // arrange
            stubStore.error = "fail";

            // act
            try {
                await subject.readSigninResponseState("state=state")
            fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('fail');
            }
        });

        it("should deserialize stored state and return state and response", async () => {
            // arrange
            stubStore.item = new SigninState({ id: '1', nonce: '2', authority:'authority', client_id:'client', request_type:'type' }).toStorageString();

            // act
            let { state, response } = await subject.readSigninResponseState("state=1")

            // assert
            expect(state.id).toEqual('1');
            expect(state.nonce).toEqual('2');
            expect(state.authority).toEqual('authority');
            expect(state.client_id).toEqual('client');
            expect(state.request_type).toEqual('type');
            expect(response.state).toEqual('1');
        });
    });

    describe("processSigninResponse", () => {

        it("should return a promise", async () => {
            // act
            var p = subject.processSigninResponse("state=state");

            // assert
            expect(p).toBeInstanceOf(Promise);
            try { await p; } catch(_err) {}
        });

        it("should fail if no state on response", async () => {
            // arrange
            stubStore.item = "state";

            // act
            try {
                await subject.processSigninResponse("");
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('state');
            }
        });

        it("should fail if storage fails", async () => {
            // arrange
            stubStore.error = "fail";

            // act
            try {
                await subject.processSigninResponse("state=state");
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('fail');
            }
        });

        it("should deserialize stored state and call validator", async () => {
            // arrange
            stubStore.item = new SigninState({ id: '1', nonce: '2', authority:'authority', client_id:'client' }).toStorageString();

            // act
            let response = await subject.processSigninResponse("state=1");

            // assert
            expect(stubResponseValidator.signinState.id).toEqual('1');
            expect(stubResponseValidator.signinState.nonce).toEqual('2');
            expect(stubResponseValidator.signinState.authority).toEqual('authority');
            expect(stubResponseValidator.signinState.client_id).toEqual('client');
            expect(stubResponseValidator.signinResponse).toEqual(response);
        });
    });

    describe("createSignoutRequest", () => {

        it("should return a promise", async () => {
            // arrange
            stubMetadataService.getEndSessionEndpointResult = Promise.resolve("http://sts/signout");

            // act
            var p = subject.createSignoutRequest();

            // assert
            expect(p).toBeInstanceOf(Promise);
            try { await p; } catch(_err) {}
        });

        it("should return SignoutRequest", async () => {
            // arrange
            stubMetadataService.getEndSessionEndpointResult = Promise.resolve("http://sts/signout");

            // act
            var request = await subject.createSignoutRequest();

            // assert
            expect(request).toBeInstanceOf(SignoutRequest);
        });

        it("should pass state in place of data to SignoutRequest", async () => {
            // arrange
            stubMetadataService.getEndSessionEndpointResult = Promise.resolve("http://sts/signout");

            // act
            const request = await subject.createSignoutRequest({
                state: 'foo',
                post_logout_redirect_uri: "bar",
                id_token_hint: "baz"
            });

            // assert
            expect(request.state).toBeDefined();
            expect(request.state!.data).toEqual('foo');
            const url = request.url;
            expect(url).toContain("http://sts/signout");
            expect(url).toContain("post_logout_redirect_uri=bar");
            expect(url).toContain("id_token_hint=baz");
        });

        it("should pass params to SignoutRequest", async () => {
            // arrange
            stubMetadataService.getEndSessionEndpointResult = Promise.resolve("http://sts/signout");

            // act
            const request = await subject.createSignoutRequest({
                data: 'foo',
                post_logout_redirect_uri: "bar",
                id_token_hint: "baz"
            });

            // assert
            expect(request.state).toBeDefined();
            expect(request.state!.data).toEqual('foo');
            const url = request.url;
            expect(url).toContain("http://sts/signout");
            expect(url).toContain("post_logout_redirect_uri=bar");
            expect(url).toContain("id_token_hint=baz");
        });

        it("should fail if metadata fails", async () => {
            // arrange
            stubMetadataService.getEndSessionEndpointResult = Promise.reject(new Error("test"));

            // act
            try {
                await subject.createSignoutRequest();
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("test");
            }
        });

        it("should fail if no signout endpoint on metadata", async () => {
            // arrange
            stubMetadataService.getEndSessionEndpointResult = Promise.resolve(undefined);

            // act
            try {
                await subject.createSignoutRequest();
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("no end session endpoint");
            }
        });

        it("should store state", async () => {
            // arrange
            stubMetadataService.getEndSessionEndpointResult = Promise.resolve("http://sts/signout");

            // act
            await subject.createSignoutRequest({
                data:"foo", id_token_hint:'hint'
            });

            // assert
            expect(stubStore.item).toBeDefined();
        });

        it("should not generate state if no data", async () => {
            // arrange
            stubMetadataService.getEndSessionEndpointResult = Promise.resolve("http://sts/signout");

            // act
            await subject.createSignoutRequest();

            // assert
            expect(stubStore.item).toBeUndefined();
        });
    });

    describe("readSignoutResponseState", () => {
        it("should return a promise", async () => {
            // act
            const p = subject.readSignoutResponseState("state=state");

            // assert
            expect(p).toBeInstanceOf(Promise);
            try { await p; } catch(_err) {}
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
            } catch (err) {
                expect(err.error).toEqual("foo");
            }
        });

        it("should fail if storage fails", async () => {
            // arrange
            stubStore.error = "fail";

            // act
            try {
                await subject.readSignoutResponseState("state=state");
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("fail");
            }
        });

        it("should deserialize stored state and return state and response", async () => {
            // arrange
            stubStore.item = new State({ id: '1', request_type:'type' }).toStorageString();

            // act
            const { state, response } = await subject.readSignoutResponseState("state=1");

            // assert
            expect(state).toBeDefined();
            expect(state!.id).toEqual('1');
            expect(state!.request_type).toEqual('type');
            expect(response.state).toEqual('1');
        });

        it("should call validator with state even if error in response", async () => {
            // arrange
            stubStore.item = new State({ id: '1', data:"bar" }).toStorageString();

            // act
            const response = await subject.processSignoutResponse("state=1&error=foo");

            // assert
            expect(stubResponseValidator.signoutState.id).toEqual('1');
            expect(stubResponseValidator.signoutResponse).toEqual(response);
        });
    });

    describe("processSignoutResponse", () => {

        it("should return a promise", async () => {
            // act
            var p = subject.processSignoutResponse("state=state");

            // assert
            expect(p).toBeInstanceOf(Promise);
            try { await p; } catch(_err) {}
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
            } catch (err) {
                expect(err.error).toEqual("foo");
            }
        });

        it("should fail if storage fails", async () => {
            // arrange
            stubStore.error = "fail";

            // act
            try {
                await subject.processSignoutResponse("state=state");
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("fail");
            }
        });

        it("should deserialize stored state and call validator", async () => {
            // arrange
            stubStore.item = new State({ id: '1' }).toStorageString();

            // act
            const response = await subject.processSignoutResponse("state=1");

            // assert
            expect(stubResponseValidator.signoutState.id).toEqual('1');
            expect(stubResponseValidator.signoutResponse).toEqual(response);
        });

        it("should call validator with state even if error in response", async () => {
            // arrange
            stubStore.item = new State({ id: '1', data:"bar" }).toStorageString();

            // act
            const response = await subject.processSignoutResponse("state=1&error=foo");

            // assert
            expect(stubResponseValidator.signoutState.id).toEqual('1');
            expect(stubResponseValidator.signoutResponse).toEqual(response);
        });
    });

    describe("clearStaleState", () => {

        it("should return a promise", async () => {
            // act
            var p = subject.clearStaleState();

            // assert
            expect(p).toBeInstanceOf(Promise);
            try { await p; } catch(_err) {}
        });

        it("should call State.clearStaleState", () => {
            // arrange
            var oldState = State.clearStaleState;
            State.clearStaleState = jest.fn();

            // act
            subject.clearStaleState();

            // assert
            expect(State.clearStaleState).toBeCalled();
            State.clearStaleState = oldState;
        });
    });
});
