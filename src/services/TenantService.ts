import { Repository } from "typeorm";
import { ITenant } from "../types";
import { Tenant } from "../entity/Tenant";

export class TenantService {
    constructor(private tenantRepository: Repository<Tenant>) {}
    async Create(tenantData: ITenant) {
        return await this.tenantRepository.save(tenantData);
    }
    async getAll() {
        return await this.tenantRepository.find();
    }
    async getById(tenantId: number) {
        return await this.tenantRepository.findOne({ where: { id: tenantId } });
    }
    async update(id: number, tenantData: ITenant) {
        return await this.tenantRepository.update(id, tenantData);
    }
    async deleteById(tenantId: number) {
        return await this.tenantRepository.delete(tenantId);
    }
}
