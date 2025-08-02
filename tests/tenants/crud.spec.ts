import createJWKSMock from "mock-jwks";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { Roles } from "../../src/constants";
import request from "supertest";
import app from "../../src/app";
import { ITenant } from "../../src/types";

jest.setTimeout(15000);

describe("GET /tenants", () => {
    let connection: DataSource, jwks: ReturnType<typeof createJWKSMock>;
    let adminToken: string, tenantData: ITenant;

    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        connection = await AppDataSource.initialize();
        adminToken = jwks.token({
            sub: "1",
            role: Roles.ADMIN,
        });
        tenantData = {
            name: "Tenant Name",
            address: "Tenant Address",
        };
    });
    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
        jwks.start();
    });
    afterEach(() => {
        jwks.stop();
    });
    afterAll(async () => {
        await connection.destroy();
    });
    it("Should return an array of tenants with pagination and search filters", async () => {
        // Create multiple tenants
        const tenants = [
            { name: "Alpha Tenant", address: "Alpha Address" },
            { name: "Beta Tenant", address: "Beta Address" },
            { name: "Gamma Tenant", address: "Gamma Address" },
        ];
        for (const t of tenants) {
            await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(t);
        }

        // Test pagination: perPage=2, currentPage=1
        let response = await request(app)
            .get("/tenants?perPage=2&currentPage=1")
            .set("Cookie", [`accessToken=${adminToken}`]);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBe(2);
        expect(response.body.total).toBe(3);
        expect(response.body.perPage).toBe(2);
        expect(response.body.currentPage).toBe(1);

        // Test pagination: perPage=2, currentPage=2
        response = await request(app)
            .get("/tenants?perPage=2&currentPage=2")
            .set("Cookie", [`accessToken=${adminToken}`]);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.total).toBe(3);
        expect(response.body.perPage).toBe(2);
        expect(response.body.currentPage).toBe(2);

        // Test search filter: q=Beta
        response = await request(app)
            .get("/tenants?q=Beta")
            .set("Cookie", [`accessToken=${adminToken}`]);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].name).toBe("Beta Tenant");
        expect(response.body.data[0].address).toBe("Beta Address");
    });
    it("Should return a tenant object", async () => {
        // Create a tenant
        const createTenantRes = await request(app)
            .post("/tenants")
            .set("Cookie", [`accessToken=${adminToken}`])
            .send(tenantData);
        // Get a tenant
        const response = await request(app)
            .get(`/tenants/${createTenantRes.body.id}`)
            .set("Cookie", [`accessToken=${adminToken}`]);

        expect(response.statusCode).toBe(200);
        expect(response.body.name).toBe(tenantData.name);
        expect(response.body.address).toBe(tenantData.address);
    });
    it("Should update the tenant", async () => {
        // Create a tenant
        const createTenantRes = await request(app)
            .post("/tenants")
            .set("Cookie", [`accessToken=${adminToken}`])
            .send(tenantData);

        // Update the tenant
        const response = await request(app)
            .patch(`/tenants/${createTenantRes.body.id}`)
            .set("Cookie", [`accessToken=${adminToken}`])
            .send({
                name: "Yusuf",
                address: "Tenant Address",
            });
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createTenantRes.body.id);

        const tenantResponse = await request(app)
            .get(`/tenants/${createTenantRes.body.id}`)
            .set("Cookie", [`accessToken=${adminToken}`]);

        expect(tenantResponse.body.name).toBe("Yusuf");
        expect(tenantResponse.body.address).toBe("Tenant Address");
    });
    it("Should delete a tenant", async () => {
        // Create a tenant
        const createTenantRes = await request(app)
            .post("/tenants")
            .set("Cookie", [`accessToken=${adminToken}`])
            .send(tenantData);
        const tenantId = createTenantRes.body.id;
        // Delete tenant
        const response = await request(app)
            .delete(`/tenants/${tenantId}`)
            .set("Cookie", [`accessToken=${adminToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(tenantId);

        const tenantResponse = await request(app)
            .get(`/tenants/${tenantId}`)
            .set("Cookie", [`accessToken=${adminToken}`]);

        expect(tenantResponse.status).toBe(400);
    });
});
