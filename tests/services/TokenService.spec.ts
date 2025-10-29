import { TokenService } from "../../src/services/TokenService";
import { Repository } from "typeorm";
import { RefreshToken } from "../../src/entity/RefreshToken";
import { Config } from "../../src/config";
import * as fs from "node:fs";
import path from "node:path";
import { sign } from "jsonwebtoken";

// Mock the dependencies
jest.mock("typeorm");
jest.mock("node:fs");
jest.mock("jsonwebtoken");

describe("TokenService", () => {
    let tokenService: TokenService;
    let mockRefreshTokenRepo: jest.Mocked<Repository<RefreshToken>>;
    const mockPrivateKey = "mock-private-key";
    const mockSignedToken = "mock.signed.token";

    beforeEach(() => {
        mockRefreshTokenRepo = {
            save: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<Repository<RefreshToken>>;
        tokenService = new TokenService(mockRefreshTokenRepo);

        // Reset all mocks before each test
        jest.clearAllMocks();
        // Reset Config.PRIVATE_KEY
        delete (Config as any).PRIVATE_KEY;

        // Mock jwt sign to avoid actual crypto operations in tests
        (sign as jest.Mock).mockReturnValue(mockSignedToken);
    });

    describe("generateAccessToken", () => {
        const payload = { id: 1, email: "test@example.com" };

        describe("when private key is not available in Config", () => {
            it("should attempt to read private key from file system and return signed token", async () => {
                // Mock successful file read
                (fs.readFileSync as jest.Mock).mockReturnValue(mockPrivateKey);

                const token = await tokenService.generateAccessToken(
                    payload as any,
                );

                expect(fs.readFileSync).toHaveBeenCalledWith(
                    path.join(__dirname, "../../certs/private.pem"),
                );
                expect(sign).toHaveBeenCalledWith(
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

            it("should throw error if private key file read fails", async () => {
                // Mock file read error
                (fs.readFileSync as jest.Mock).mockImplementation(() => {
                    throw new Error("File not found");
                });

                await expect(async () => {
                    await tokenService.generateAccessToken(payload as any);
                }).rejects.toThrow("Error while reading private key");

                expect(fs.readFileSync).toHaveBeenCalledWith(
                    path.join(__dirname, "../../certs/private.pem"),
                );
                expect(sign).not.toHaveBeenCalled();
            });

            it("should throw error if private key is still not available after file read", async () => {
                // Mock file read returning null
                (fs.readFileSync as jest.Mock).mockReturnValue(null);

                await expect(async () => {
                    await tokenService.generateAccessToken(payload as any);
                }).rejects.toThrow(
                    "Private key is not available for signing tokens",
                );

                expect(fs.readFileSync).toHaveBeenCalledWith(
                    path.join(__dirname, "../../certs/private.pem"),
                );
                expect(sign).not.toHaveBeenCalled();
            });
        });

        describe("when private key is available in Config", () => {
            it("should not attempt to read from file system and return signed token", async () => {
                // Set private key in config
                (Config as any).PRIVATE_KEY = mockPrivateKey;

                const token = await tokenService.generateAccessToken(
                    payload as any,
                );

                expect(fs.readFileSync).not.toHaveBeenCalled();
                expect(sign).toHaveBeenCalledWith(
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
