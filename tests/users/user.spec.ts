import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { DataSource } from "typeorm";
import createJWKSMock from "mock-jwks";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";

describe("POST /auth/self", () => {
    let connection: DataSource, jwks: ReturnType<typeof createJWKSMock>;
    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        connection = await AppDataSource.initialize();
    });
    beforeEach(async () => {
        jwks.start();
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterEach(() => {
        jwks.stop();
    });
    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should return status code 200", async () => {
            const accessToken = jwks.token({
                sub: "1",
                role: Roles.CUSTOMER,
            });
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`]);
            expect(response.statusCode).toBe(200);
        });

        it("should return user data", async () => {
            //Register user
            const userData = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "yusufali.5094@gmail.com",
                password: "secret12",
            };
            const userRepository = connection.getRepository(User);
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();
            expect(response.body.id).toBe(data.id);
        });
    });
});
