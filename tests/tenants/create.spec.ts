import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { DataSource } from "typeorm";
import { Tenant } from "../../src/entity/Tenant";

describe("POST /tenants", () => {
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
        it("should return 201 status code", async () => {
            // Arrange
            const tenantData = {
                name: "Tenant Name",
                address: "Tenant Address",
            };
            // Act
            const response = await request(app)
                .post("/tenants")
                .send(tenantData);
            // Assert
            expect(response.statusCode).toBe(201);
        });

        it("Should create a tenant in the database", async () => {
            // Arrange
            const tenantData = {
                name: "Tenant Name",
                address: "Tenant Address",
            };
            // Act
            await request(app).post("/tenants").send(tenantData);
            // Assert
            const tenantRepo = connection.getRepository(Tenant);
            const tenant = await tenantRepo.find();
            expect(tenant).toHaveLength(1);
            expect(tenant[0].name).toBe(tenantData.name);
            expect(tenant[0].address).toBe(tenantData.address);
        });
    });
});
