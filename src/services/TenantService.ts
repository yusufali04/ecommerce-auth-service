import { Repository } from "typeorm";
import { ITenant, ITenantUpdate } from "../types";
import { Tenant } from "../entity/Tenant";

export class TenantService {
    constructor(private tenantRepository: Repository<Tenant>) {}
    async Create(tenantData: ITenant) {
        return await this.tenantRepository.save(tenantData);
    }
    async GetAll() {
        const tenants = this.tenantRepository.find();
        // eslint-disable-next-line no-console
        console.log(tenants);

        return tenants;
    }
    async GetById(tenantId: number) {
        return await this.tenantRepository.findOneBy({ id: tenantId });
    }
    async Update(updateData: ITenantUpdate) {
        const data: ITenant = {
            name: updateData.name,
            address: updateData.address,
        };
        return await this.tenantRepository.update({ id: updateData.id }, data);
    }
}
