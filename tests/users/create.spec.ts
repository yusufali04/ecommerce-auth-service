import { DataSource } from "typeorm";
import request from "supertest";
import createJWKSMock from "mock-jwks";

import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";
import { Roles } from "../../src/constants";
import { User } from "../../src/entity/User";
import { Tenant } from "../../src/entity/Tenant";
import { createTenant } from "../utils";

describe("POST /users", () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

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
        it("should persist the user in the database", async () => {
            // create tenant first
            const tenant = await createTenant(connection.getRepository(Tenant));
            const adminToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            });

            // Register user
            const userData = {
                firstName: "Yusuf",
                lastName: "M",
                email: "yusuf@gmail.com",
                password: "password",
                tenantId: tenant.id,
                role: Roles.MANAGER,
            };

            // Add token to cookie
            await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users).toHaveLength(1);
            expect(users[0].email).toBe(userData.email);
        });
        it("should create a manager user", async () => {
            // Create a tenant
            const tenant = await createTenant(connection.getRepository(Tenant));
            const adminToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            });

            // Register user
            const userData = {
                firstName: "Yusuf",
                lastName: "M",
                email: "yusuf@gmail.com",
                password: "password",
                role: Roles.MANAGER,
                tenantId: tenant.id,
            };

            // Add token to cookie
            await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users).toHaveLength(1);
            expect(users[0].role).toBe(Roles.MANAGER);
        });
    });
});
