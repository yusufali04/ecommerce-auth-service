import createJWKSMock from "mock-jwks";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { Roles } from "../../src/constants";
import request from "supertest";
import app from "../../src/app";
import { ITenant } from "../../src/types";

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
    }, 15000);
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
    it("Should return an array of tenants", async () => {
        // Create a tenant
        await request(app)
            .post("/tenants")
            .set("Cookie", [`accessToken=${adminToken}`])
            .send(tenantData);
        // get all tenants
        const response = await request(app)
            .get("/tenants")
            .set("Cookie", [`accessToken=${adminToken}`]);
        expect(response.statusCode).toBe(200);
        expect(response.body[0].name).toBe(tenantData.name);
        expect(response.body[0].address).toBe(tenantData.address);
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
