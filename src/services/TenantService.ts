import { Repository } from "typeorm";
import { ITenant, TenantQueryParams } from "../types";
import { Tenant } from "../entity/Tenant";

export class TenantService {
    constructor(private readonly tenantRepository: Repository<Tenant>) {}
    async Create(tenantData: ITenant) {
        return await this.tenantRepository.save(tenantData);
    }
    async getAll(validatedQuery: TenantQueryParams) {
        const queryBuilder = this.tenantRepository.createQueryBuilder("tenant");
        if (validatedQuery.q) {
            queryBuilder.where(
                "tenant.name ILIKE :q OR tenant.address ILIKE :q",
                { q: `%${validatedQuery.q}%` },
            );
        }
        const results = await queryBuilder
            .skip((validatedQuery.currentPage - 1) * validatedQuery.perPage)
            .orderBy("tenant.id", "DESC")
            .take(validatedQuery.perPage)
            .getManyAndCount();
        return results;
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
