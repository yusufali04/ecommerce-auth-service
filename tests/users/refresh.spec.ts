import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { DataSource } from "typeorm";
import { RefreshToken } from "../../src/entity/RefreshToken";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
import createJWKSMock from "mock-jwks";
import { sign } from "jsonwebtoken";
import { Config } from "../../src/config";

describe("POST /auth/refresh", () => {
    let connection: DataSource, jwks: ReturnType<typeof createJWKSMock>;
    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        connection = await AppDataSource.initialize();
    }, 15000);
    beforeEach(async () => {
        jwks.start();
        await connection.dropDatabase();
        await connection.synchronize();
    }, 15000);

    afterEach(() => {
        jwks.stop();
    });
    afterAll(async () => {
        await connection.destroy();
    });

    it("Should return status code as 200", async () => {
        // Register user (Arrange)
        const userData = {
            firstName: "Yusuf",
            lastName: "Ali",
            email: "yusufali.5094@gmail.com",
            password: "secret12",
            role: Roles.MANAGER,
        };

        const userRepository = connection.getRepository(User);
        const refreshTokenRepo = connection.getRepository(RefreshToken);
        const data = await userRepository.save({
            ...userData,
        });
        const refreshTokenRecord = await refreshTokenRepo.save({
            user: data,
            expiresIn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        });
        const payload = {
            sub: data.id,
            role: data.role,
            id: refreshTokenRecord.id,
        };
        const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
            algorithm: "HS256",
            expiresIn: "1y",
            issuer: "auth-service",
            jwtid: String(payload.id),
        });
        // Act
        const response = await request(app)
            .post("/auth/refresh")
            .set("Cookie", [`refreshToken=${refreshToken}`])
            .send();
        // Assert
        expect(response.statusCode).toBe(200);
    });
});
