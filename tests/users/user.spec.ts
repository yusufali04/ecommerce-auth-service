import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { DataSource } from "typeorm";
import createJWKSMock from "mock-jwks";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
import { UserData } from "../../src/types";

describe("POST /auth/self", () => {
    let connection: DataSource, jwks: ReturnType<typeof createJWKSMock>;
    let adminToken: string, userData: UserData;
    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        connection = await AppDataSource.initialize();

        adminToken = jwks.token({
            sub: "1",
            role: Roles.ADMIN,
        });
        userData = {
            firstName: "Yusuf",
            lastName: "Momin",
            email: "Yusuf@gmail.com",
            password: "Yusuf",
            role: "CUSTOMER",
        };
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
            //Register user (Arrange)
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
            // Act
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();
            // Assert
            expect(response.body.id).toBe(data.id);
        });
        it("should not return password along with user data", async () => {
            //Register user (Arrange)
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
            // Act
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();
            // Assert
            expect(response.body).not.toHaveProperty("password");
        });
        it("should return 401 status code if token does not exist", async () => {
            //Register user (Arrange)
            const userData = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "yusufali.5094@gmail.com",
                password: "secret12",
            };
            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });
            // Act
            const response = await request(app).get("/auth/self").send();
            // Assert
            expect(response.statusCode).toBe(401);
        });
    });

    describe("User CRUD operations", () => {
        it("Should return an array of users with status 200", async () => {
            await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(userData);

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0].firstName).toBe(userData.firstName);
            expect(response.body[0].lastName).toBe(userData.lastName);
        });
        it("Should delete a user and return 200", async () => {
            // create user
            const createUserRes = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(userData);
            // delete user
            const response = await request(app)
                .delete(`/users/${createUserRes.body.id}`)
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(createUserRes.body.id);

            const tenantResponse = await request(app)
                .get("/users/getById")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({ id: createUserRes.body.id });

            expect(tenantResponse.status).toBe(400);
        });
        it("Should update the user and return status 204", async () => {
            // create user
            const createUserRes = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(userData);

            const response = await request(app)
                .patch(`/users/${createUserRes.body.id}`)
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({ firstName: "Touhid", lastName: "Muhammad" });
            expect(response.status).toBe(200);

            const allUsersResponse = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(allUsersResponse.body[0].firstName).toBe("Touhid");
            expect(allUsersResponse.body[0].lastName).toBe("Muhammad");
        });
    });
});
