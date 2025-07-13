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
    });
    beforeEach(() => {
        jwks.start();
    });
    afterEach(() => {
        jwks.stop();
    });
    afterAll(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
        await connection.destroy();
    });

    it("Should return an array of tenants with status 200", async () => {
        await request(app)
            .post("/tenants")
            .set("Cookie", [`accessToken=${adminToken}`])
            .send(tenantData);
        const response = await request(app)
            .get("/tenants/get-all")
            .set("Cookie", [`accessToken=${adminToken}`]);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0].name).toBe(tenantData.name);
        expect(response.body[0].address).toBe(tenantData.address);
    });

    it("Should return a tenant object with status 200", async () => {
        const createTenantRes = await request(app)
            .post("/tenants")
            .set("Cookie", [`accessToken=${adminToken}`])
            .send(tenantData);
        const response = await request(app)
            .get("/tenants/getById")
            .set("Cookie", [`accessToken=${adminToken}`])
            .send({ tenantId: createTenantRes.body.id });

        expect(response.statusCode).toBe(200);
        expect(response.body.name).toBe(tenantData.name);
        expect(response.body.address).toBe(tenantData.address);
    });

    it("Should update the tenant and return status 204", async () => {
        const createTenantRes = await request(app)
            .post("/tenants")
            .set("Cookie", [`accessToken=${adminToken}`])
            .send(tenantData);

        const response = await request(app)
            .post("/tenants/update")
            .set("Cookie", [`accessToken=${adminToken}`])
            .send({
                id: createTenantRes.body.id,
                name: "Yusuf",
                address: "Tenant Address",
            });
        expect(response.statusCode).toBe(204);

        const tenantResponse = await request(app)
            .get("/tenants/getById")
            .set("Cookie", [`accessToken=${adminToken}`])
            .send({ tenantId: createTenantRes.body.id });

        expect(tenantResponse.body.name).toBe("Yusuf");
        expect(tenantResponse.body.address).toBe("Tenant Address");
    });
});
