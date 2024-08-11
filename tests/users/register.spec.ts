import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { DataSource } from "typeorm";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
import { isJwt } from "../utils";

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
                password: "secret12",
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
                password: "secret12",
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
                password: "secret12",
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
                password: "secret12",
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
                password: "secret12",
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
                password: "secret12",
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
                password: "secret12",
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

        it("Should return access token and refresh token in a cookie", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "yusufali567@gmail.com",
                password: "secret1278",
            };
            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(data);
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
    });

    describe("Fields are missing", () => {
        it("Should return status code 400 if email field is missing", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "",
                password: "secret12",
            };
            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(data);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(Array.isArray(response.body.errors)).toBe(true);
            expect(response.body.errors[0].msg).toBe("Email is required");
            expect(users).toHaveLength(0);
        });
        it("Should return 400 status code if firstName field is missing", async () => {
            // Arrange
            const data = {
                firstName: "",
                lastName: "Ali",
                email: "yusufali.5094@gmail.com",
                password: "secret12",
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
        it("Should return 400 status code if lastName field is missing", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "",
                email: "yusufali.5094@gmail.com",
                password: "secret12",
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
        it("Should return 400 status code if password field is missing", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "yusufali.5094@gmail.com",
                password: "",
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
                password: "secret12",
            };
            // Act
            await request(app).post("/auth/register").send(data);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            const user = users[0];
            expect(user.email).toBe("yusufali.5094@gmail.com");
        });
        it("Should return 400 statuscode if email is not valid", async () => {
            // Arrange
            const data = {
                firstName: "Yusuf",
                lastName: "Ali",
                email: "yusufali.5094@gmail",
                password: "secret12",
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
        it("Should return 400 status code if password length is less than 8 charecters", async () => {
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
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });
    });
});
