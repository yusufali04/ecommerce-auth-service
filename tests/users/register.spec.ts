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

        it("should store hashed password", async () => {
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
            expect(users[0].password).not.toBe(data.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
        });

        it("Should return 400 status code if email already exists", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "yusufali.5094@gmail.com",
                password: "secret",
            };
            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...data, role: "customer" });
            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(data);
            // Assert
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });
    });

    describe("Fields are missing", () => {
        it("Should return status code 400 if email field is missing", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "",
                password: "secret",
            };
            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(data);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });
    });

    describe("Fields are not in proper format", () => {
        it("Should trim the email field", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: " yusufali.5094@gmail.com ",
                password: "secret",
            };
            // Act
            await request(app).post("/auth/register").send(data);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            const user = users[0];
            expect(user.email).toBe("yusufali.5094@gmail.com");
        });
    });
});
