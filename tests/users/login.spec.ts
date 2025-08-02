import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { DataSource } from "typeorm";
import { isJwt } from "../utils";
import { RefreshToken } from "../../src/entity/RefreshToken";
import { Roles } from "../../src/constants";

jest.setTimeout(15000);
describe("POST /auth/login", () => {
    let connection: DataSource;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });
    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
        const data = {
            firstName: "Yusuf",
            lastName: "Ali",
            email: "yusufali@gmail.com",
            password: "secret12",
            role: Roles.ADMIN,
        };
        const response = await request(app).post("/auth/register").send(data);
        expect(response.statusCode).toBe(201);
    });
    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should return status 200", async () => {
            // Arrange
            const loginData = {
                email: "yusufali@gmail.com",
                password: "secret12",
            };
            // Act
            const response = await request(app)
                .post("/auth/login")
                .send(loginData);
            // Assert
            expect(response.statusCode).toBe(200);
        });
        it("should return valid json response", async () => {
            // Arrange
            const loginData = {
                email: "yusufali@gmail.com",
                password: "secret12",
            };
            // Act
            const response = await request(app)
                .post("/auth/login")
                .send(loginData);
            // Assert
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
        });
        it("Should return id of the logged in user", async () => {
            // Arrange
            const loginData = {
                email: "yusufali@gmail.com",
                password: "secret12",
            };
            // Act
            const response = await request(app)
                .post("/auth/login")
                .send(loginData);
            // Assert
            expect(response.body.id).toEqual(expect.any(Number));
        });
        it("Should return 400 status code if email is incorrect", async () => {
            // Arrange
            const loginData = {
                email: "yusufali12@gmail.com",
                password: "secret12",
            };
            // Act
            const response = await request(app)
                .post("/auth/login")
                .send(loginData);
            // Assert
            expect(response.statusCode).toBe(400);
        });
        it("Should return 400 status code if password is incorrect", async () => {
            // Arrange
            const loginData = {
                email: "yusufali@gmail.com",
                password: "secret12345",
            };
            // Act
            const response = await request(app)
                .post("/auth/login")
                .send(loginData);
            // Assert
            expect(response.statusCode).toBe(400);
        });
        it("Should return access token and refresh token in a cookie", async () => {
            // Arrange
            const loginData = {
                email: "yusufali@gmail.com",
                password: "secret12",
            };
            // Act
            const response = await request(app)
                .post("/auth/login")
                .send(loginData);
            // Assert
            let accessToken: string | null = null;
            let refreshToken: string | null = null;
            const cookiesArray = response.headers["set-cookie"] || [];
            (cookiesArray as string[]).forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    accessToken = cookie.split(";")[0].split("=")[1];
                }
                if (cookie.startsWith("refreshToken=")) {
                    refreshToken = cookie.split(";")[0].split("=")[1];
                }
            });
            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();
            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToken)).toBeTruthy();
        });
        it("should store the refresh token into database", async () => {
            // Arrange
            const loginData = {
                email: "yusufali@gmail.com",
                password: "secret12",
            };
            // Act
            const response = await request(app)
                .post("/auth/login")
                .send(loginData);
            // Assert
            const refreshTokenRepo = connection.getRepository(RefreshToken);
            const tokens = await refreshTokenRepo
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: response.body.id,
                })
                .getMany();
            expect(tokens).toHaveLength(2);
        });
    });
});
