import { Repository } from "typeorm";
import { RefreshToken } from "../../src/entity/RefreshToken";
import path from "node:path";

// Mock the typeorm dependency (we'll mock other modules per-test)
jest.mock("typeorm");

describe("TokenService", () => {
    let tokenService: any;
    let mockRefreshTokenRepo: jest.Mocked<Repository<RefreshToken>>;
    const mockPrivateKey = "mock-private-key";
    const mockSignedToken = "mock.signed.token";

    beforeEach(() => {
        mockRefreshTokenRepo = {
            save: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<Repository<RefreshToken>>;
        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Reset module registry and restore mocks
        jest.resetModules();
        jest.restoreAllMocks();
    });

    describe("generateAccessToken", () => {
        const payload = { id: 1, email: "test@example.com" };

        describe("when private key is not available in Config", () => {
            it("should attempt to read private key from file system and return signed token", async () => {
                // Load the module with fs mocked to return a mock private key and jsonwebtoken.sign mocked
                await jest.isolateModulesAsync(async () => {
                    // Mock Config so PRIVATE_KEY is not set and signing uses mocked jsonwebtoken
                    jest.doMock("../../src/config", () => ({
                        Config: {
                            PRIVATE_KEY: undefined,
                            REFRESH_TOKEN_SECRET: "test-refresh-secret",
                        },
                    }));
                    jest.doMock("node:fs", () => ({
                        readFileSync: jest.fn().mockReturnValue(mockPrivateKey),
                    }));
                    jest.doMock("jsonwebtoken", () => ({
                        sign: jest.fn().mockReturnValue(mockSignedToken),
                    }));

                    // Import TokenService after mocks are in place
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const {
                        TokenService: TS,
                    } = require("../../src/services/TokenService");
                    tokenService = new TS(mockRefreshTokenRepo);

                    const token = await tokenService.generateAccessToken(
                        payload as any,
                    );

                    // fs.readFileSync was called (the mocked function)
                    const fsMock = require("node:fs");
                    expect(fsMock.readFileSync).toHaveBeenCalledWith(
                        path.join(__dirname, "../../certs/private.pem"),
                    );

                    const jwtMock = require("jsonwebtoken");
                    expect(jwtMock.sign).toHaveBeenCalledWith(
                        payload,
                        mockPrivateKey,
                        expect.objectContaining({
                            algorithm: "RS256",
                            expiresIn: "30m",
                            issuer: "auth-service",
                        }),
                    );
                    expect(token).toBe(mockSignedToken);
                });
            });

            it("should throw error if private key file read fails", async () => {
                await jest.isolateModulesAsync(async () => {
                    jest.doMock("node:fs", () => ({
                        readFileSync: jest.fn().mockImplementation(() => {
                            throw new Error("File not found");
                        }),
                    }));
                    jest.doMock("jsonwebtoken", () => ({
                        sign: jest.fn(),
                    }));

                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const {
                        TokenService: TS,
                    } = require("../../src/services/TokenService");
                    tokenService = new TS(mockRefreshTokenRepo);

                    await expect(async () => {
                        await tokenService.generateAccessToken(payload as any);
                    }).rejects.toThrow("Error while reading private key");

                    const fsMock = require("node:fs");
                    expect(fsMock.readFileSync).toHaveBeenCalledWith(
                        path.join(__dirname, "../../certs/private.pem"),
                    );
                    const jwtMock = require("jsonwebtoken");
                    expect(jwtMock.sign).not.toHaveBeenCalled();
                });
            });

            it("should throw error if private key is still not available after file read", async () => {
                await jest.isolateModulesAsync(async () => {
                    jest.doMock("node:fs", () => ({
                        readFileSync: jest.fn().mockReturnValue(null),
                    }));
                    jest.doMock("jsonwebtoken", () => ({
                        sign: jest.fn(),
                    }));

                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const {
                        TokenService: TS,
                    } = require("../../src/services/TokenService");
                    tokenService = new TS(mockRefreshTokenRepo);

                    await expect(async () => {
                        await tokenService.generateAccessToken(payload as any);
                    }).rejects.toThrow(
                        "Private key is not available for signing tokens",
                    );

                    const fsMock = require("node:fs");
                    expect(fsMock.readFileSync).toHaveBeenCalledWith(
                        path.join(__dirname, "../../certs/private.pem"),
                    );
                    const jwtMock = require("jsonwebtoken");
                    expect(jwtMock.sign).not.toHaveBeenCalled();
                });
            });
        });

        describe("when private key is available in Config", () => {
            it("should not attempt to read from file system and return signed token", async () => {
                await jest.isolateModulesAsync(async () => {
                    // Mock Config so PRIVATE_KEY is set and fs should not be used
                    jest.doMock("../../src/config", () => ({
                        Config: {
                            PRIVATE_KEY: mockPrivateKey,
                            REFRESH_TOKEN_SECRET: "test-refresh-secret",
                        },
                    }));
                    // Mock jsonwebtoken.sign only; fs should not be used because Config.PRIVATE_KEY is set
                    jest.doMock("jsonwebtoken", () => ({
                        sign: jest.fn().mockReturnValue(mockSignedToken),
                    }));

                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const {
                        TokenService: TS,
                    } = require("../../src/services/TokenService");
                    tokenService = new TS(mockRefreshTokenRepo);

                    const token = await tokenService.generateAccessToken(
                        payload as any,
                    );

                    const jwtMock = require("jsonwebtoken");
                    expect(jwtMock.sign).toHaveBeenCalledWith(
                        payload,
                        mockPrivateKey,
                        expect.objectContaining({
                            algorithm: "RS256",
                            expiresIn: "30m",
                            issuer: "auth-service",
                        }),
                    );
                    expect(token).toBe(mockSignedToken);
                });
            });
        });
    });
});
