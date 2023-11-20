import { calculateDiscount } from "./src/utils";
import app from "./src/app";
import request from "supertest";

describe("App", () => {
    it("should calculate the discount", () => {
        const result = calculateDiscount(100, 20);
        expect(result).toBe(20);
    });

    it("should return statuc code 200", async () => {
        const res = await request(app).get("/").send();
        expect(res.statusCode).toBe(200);
    });
});
