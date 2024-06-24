import { CryptoUtils } from "./utils";
import { TokenClient } from "./TokenClient";
import { MetadataService } from "./MetadataService";
import { type ExtraHeader, type OidcClientSettings, OidcClientSettingsStore } from "./OidcClientSettings";

describe("TokenClient", () => {
    let settings: OidcClientSettings;
    let metadataService: MetadataService;
    let subject: TokenClient;

    beforeEach(() => {
        settings = {
            authority: "authority",
            client_id: "client_id",
            redirect_uri: "redirect_uri",
        };
        const settingsStore = new OidcClientSettingsStore(settings);
        metadataService = new MetadataService(settingsStore);

        subject = new TokenClient(settingsStore, metadataService);
    });

    describe("exchangeCode", () => {
        it("should have client_id", async () => {
            // arrange
            settings.client_id = "";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);

            // act
            await expect(subject.exchangeCode({ code: "code", code_verifier: "code_verifier" }))
                // assert
                .rejects.toThrow(Error);
        });

        it("should have redirect_uri", async () => {
            // arrange
            settings.redirect_uri = "";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);

            // act
            await expect(subject.exchangeCode({ code: "code", code_verifier: "code_verifier" }))
                // assert
                .rejects.toThrow(Error);
        });

        it("should have code", async () => {
            // act
            await expect(subject.exchangeCode({ code: "", code_verifier: "code_verifier" }))
                // assert
                .rejects.toThrow(Error);
        });

        it("should have code_verifier", async () => {
            // act
            await expect(subject.exchangeCode({ code: "code", code_verifier: "" }))
                // assert
                .rejects.toThrow(Error);
        });

        it("should have client_secret when using client_secret_basic", async () => {
            // arrange
            delete settings.client_secret;
            settings.client_authentication = "client_secret_basic";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);

            // act
            await expect(subject.exchangeCode({ code: "code", code_verifier: "code_verifier" }))
                // assert
                .rejects.toThrow(Error);
        });

        it("should calculate basic auth when using client_secret_basic", async () => {
            // arrange
            settings.client_authentication = "client_secret_basic";
            settings.client_secret = "client_secret";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);
            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getTokenEndpoint")
                .mockResolvedValue("http://sts/token_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});
            const generateBasicAuthSpy = jest.spyOn(CryptoUtils, "generateBasicAuth");

            // act
            await subject.exchangeCode({ code: "code", code_verifier: "code_verifier" });

            // assert
            expect(generateBasicAuthSpy).toHaveBeenCalledWith("client_id", "client_secret");
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/token_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                    basicAuth: expect.stringContaining(""),
                }),
            );
        });

        it("should include client secret when using client_secret_post", async () => {
            // arrange
            settings.client_authentication = "client_secret_post";
            settings.client_secret = "client_secret";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);
            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getTokenEndpoint")
                .mockResolvedValue("http://sts/token_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});

            // act
            await subject.exchangeCode({ code: "code", code_verifier: "code_verifier" });

            // assert
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/token_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                    basicAuth: undefined,
                }),
            );
            const opts = postFormMock.mock.calls[0][1];
            const params = Object.fromEntries(opts.body);
            expect(params).toHaveProperty("client_secret", "client_secret");
        });

        it("should call postForm", async () => {
            // arrange
            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getTokenEndpoint")
                .mockResolvedValue("http://sts/token_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});

            // act
            await subject.exchangeCode({ code: "code", code_verifier: "code_verifier" });

            // assert
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/token_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                    basicAuth: undefined,
                }),
            );
        });

        it("should call postForm with extraHeaders if extraHeaders are supplied", async () => {
            // arrange
            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getTokenEndpoint")
                .mockResolvedValue("http://sts/token_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});
            const extraHeaders: Record<string, ExtraHeader> = { "foo": "bar" };
            // act
            await subject.exchangeCode({ code: "code", code_verifier: "code_verifier", extraHeaders: extraHeaders });

            // assert
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/token_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                    basicAuth: undefined,
                    extraHeaders: extraHeaders,
                }),
            );
        });
    });

    describe("exchangeCredentials", () => {

        it("should have client_id", async () => {
            // arrange
            settings.client_id = "";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);

            // act
            await expect(subject.exchangeCredentials({ username: "u", password: "p" }))
                // assert
                .rejects.toThrow(Error);
        });

        it("should have client_secret when using client_secret_basic", async () => {
            // arrange
            delete settings.client_secret;
            settings.client_authentication = "client_secret_basic";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);

            // act
            await expect(subject.exchangeCredentials({ username: "u", password: "p" }))
                // assert
                .rejects.toThrow(Error);
        });

        it("should calculate basic auth when using client_secret_basic", async () => {
            // arrange
            settings.client_authentication = "client_secret_basic";
            settings.client_secret = "client_secret";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);
            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getTokenEndpoint")
                .mockResolvedValue("http://sts/token_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});
            const generateBasicAuthSpy = jest.spyOn(CryptoUtils, "generateBasicAuth");

            // act
            await subject.exchangeCredentials({ username: "u", password: "p" });

            // assert
            expect(generateBasicAuthSpy).toHaveBeenCalledWith("client_id", "client_secret");
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/token_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                    basicAuth: expect.stringContaining("Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ="),
                }),
            );
        });

        it("should include client secret when using client_secret_post", async () => {
            // arrange
            settings.client_authentication = "client_secret_post";
            settings.client_secret = "client_secret";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);
            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getTokenEndpoint")
                .mockResolvedValue("http://sts/token_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});

            // act
            await subject.exchangeCredentials({ username: "u", password: "p" });

            // assert
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/token_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                    basicAuth: undefined,
                }),
            );
            const opts = postFormMock.mock.calls[0][1];
            const params = Object.fromEntries(opts.body);
            expect(params).toHaveProperty("client_secret", "client_secret");
        });

        it("should call postForm", async () => {
            // arrange
            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getTokenEndpoint")
                .mockResolvedValue("http://sts/token_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});

            // act
            await subject.exchangeCredentials({ username: "u", password: "p" });

            // assert
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/token_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                    basicAuth: undefined,
                }),
            );
        });
    });

    describe("exchangeRefreshToken", () => {
        it("should have client_id", async () => {
            // arrange
            settings.client_id = "";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);

            // act
            await expect(subject.exchangeRefreshToken({ refresh_token: "refresh_token" }))
                // assert
                .rejects.toThrow(Error);
        });

        it("should have redirect_uri", async () => {
            // arrange
            settings.redirect_uri = "";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);

            // act
            await expect(subject.exchangeRefreshToken({ refresh_token: "refresh_token" }))
                // assert
                .rejects.toThrow(Error);
        });

        it("should have refresh_token", async () => {
            // act
            await expect(subject.exchangeRefreshToken({ refresh_token: "" }))
                // assert
                .rejects.toThrow(Error);
        });

        it("should have client_secret when using client_secret_basic", async () => {
            // arrange
            delete settings.client_secret;
            settings.client_authentication = "client_secret_basic";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);

            // act
            await expect(subject.exchangeRefreshToken({ refresh_token: "refresh_token" }))
                // assert
                .rejects.toThrow("A client_secret is required");
        });

        it("should calculate basic auth when using client_secret_basic", async () => {
            // arrange
            settings.client_authentication = "client_secret_basic";
            settings.client_secret = "client_secret";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);
            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getTokenEndpoint")
                .mockResolvedValue("http://sts/token_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});

            // act
            await subject.exchangeRefreshToken({ refresh_token: "refresh_token" });

            // assert
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/token_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                    basicAuth: expect.stringContaining(""),
                    timeoutInSeconds: undefined,
                }),
            );
        });

        it("should include client secret when using client_secret_post", async () => {
            // arrange
            settings.client_authentication = "client_secret_post";
            settings.client_secret = "client_secret";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);
            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getTokenEndpoint")
                .mockResolvedValue("http://sts/token_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});

            // act
            await subject.exchangeRefreshToken({ refresh_token: "refresh_token" });

            // assert
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/token_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                    basicAuth: undefined,
                    timeoutInSeconds: undefined,
                }),
            );
            const opts = postFormMock.mock.calls[0][1];
            const params = Object.fromEntries(opts.body);
            expect(params).toHaveProperty("client_secret", "client_secret");
        });

        it("should not include scope if omitScopeWhenRequesting is true", async () => {
            settings.omitScopeWhenRequesting = true;
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);
            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getTokenEndpoint")
                .mockResolvedValue("http://sts/token_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});

            // act
            await subject.exchangeRefreshToken({ refresh_token: "refresh_token" });

            // assert
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/token_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                    basicAuth: undefined,
                    timeoutInSeconds: undefined,
                }),
            );
            const opts = postFormMock.mock.calls[0][1];
            const params = Object.fromEntries(opts.body);
            expect(params).not.toHaveProperty("scope");
        });

        it("should call postForm", async () => {
            // arrange
            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getTokenEndpoint")
                .mockResolvedValue("http://sts/token_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});

            // act
            await subject.exchangeRefreshToken({ refresh_token: "refresh_token" });

            // assert
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/token_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                    basicAuth: undefined,
                    timeoutInSeconds: undefined,
                }),
            );
        });

        it("should call postForm with extraHeaders if extraHeaders are supplied", async () => {
            // arrange
            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getTokenEndpoint")
                .mockResolvedValue("http://sts/token_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});
            const extraHeaders: Record<string, ExtraHeader> = { "foo": "bar" };
            // act
            await subject.exchangeRefreshToken({ refresh_token: "refresh_token", extraHeaders: extraHeaders });

            // assert
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/token_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                    basicAuth: undefined,
                    timeoutInSeconds: undefined,
                    extraHeaders: extraHeaders,
                }),
            );
        });
    });

    describe("revoke", () => {
        it("should have token", async () => {
            // act
            await expect(subject.revoke({ token: "", token_type_hint: "access_token" }))
                // assert
                .rejects.toThrow(Error);
        });

        it("should call postForm", async () => {
            // arrange
            settings.client_secret = "client_secret";
            subject = new TokenClient(new OidcClientSettingsStore(settings), metadataService);

            const getTokenEndpointMock = jest.spyOn(subject["_metadataService"], "getRevocationEndpoint")
                .mockResolvedValue("http://sts/revoke_endpoint");
            const postFormMock = jest.spyOn(subject["_jsonService"], "postForm")
                .mockResolvedValue({});

            // act
            await subject.revoke({ token: "token", token_type_hint: "access_token" });

            // assert
            expect(getTokenEndpointMock).toHaveBeenCalledWith(false);
            expect(postFormMock).toHaveBeenCalledWith(
                "http://sts/revoke_endpoint",
                expect.objectContaining({
                    body: expect.any(URLSearchParams),
                }),
            );
        });
    });
});
