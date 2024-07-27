import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { DataSource } from "typeorm";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";

describe("POST /auth/register", () => {
    let connection: DataSource;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });
    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });
    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should return status 201", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "yusufali.5094@gmail.com",
                password: "secret",
            };
            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(data);
            // Assert
            expect(response.statusCode).toBe(201);
        });

        it("should return valid json response", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "yusufali.5094@gmail.com",
                password: "secret",
            };
            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(data);
            // Assert
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
        });

        it("should persist the user", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "yusufali.5094@gmail.com",
                password: "secret",
            };
            // Act
            await request(app).post("/auth/register").send(data);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(data.firstName);
            expect(users[0].lastName).toBe(data.lastName);
            expect(users[0].email).toBe(data.email);
        });

        it("Should return id of the created user", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "yusufali.5094@gmail.com",
                password: "secret",
            };
            // Act
            const response: request.Response = await request(app)
                .post("/auth/register")
                .send(data);
            // Assert
            expect(response.body.id).toEqual(expect.any(Number));
        });

        it("Should assign a customer role", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "yusufali.5094@gmail.com",
                password: "secret",
            };
            // Act
            await request(app).post("/auth/register").send(data);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0]).toHaveProperty("role");
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });
    });

    describe("Fields are missing", () => {});
});
