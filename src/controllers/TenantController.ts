import { NextFunction, Response } from "express";
import { Request } from "express-jwt";
import { TenantService } from "../services/TenantService";
import { Logger } from "winston";
import { ITenantUpdate } from "../types";

export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}
    async create(req: Request, res: Response, next: NextFunction) {
        const { name, address } = req.body;
        this.logger.debug("Request for creating a tenant", req.body);
        try {
            const tenant = await this.tenantService.Create({ name, address });
            this.logger.info("Tenant has been created ", { id: tenant.id });
            res.status(201).json({ id: tenant.id });
        } catch (err) {
            next(err);
        }
    }
    async getAll(req: Request, res: Response, next: NextFunction) {
        this.logger.debug("Request for getting all the tenants", req.body);
        try {
            const tenants = await this.tenantService.GetAll();

            res.status(200).send(tenants);
        } catch (err) {
            next(err);
        }
    }
    async getById(req: Request, res: Response, next: NextFunction) {
        this.logger.debug("Request for getting a tenant", req.body);
        try {
            const tenant = await this.tenantService.GetById(
                Number(req.body.tenantId),
            );
            res.status(200).send(tenant);
        } catch (err) {
            next(err);
        }
    }
    async update(req: Request, res: Response, next: NextFunction) {
        this.logger.debug("Request for updating a tenant", req.body);
        try {
            await this.tenantService.Update(req.body as ITenantUpdate);
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    }
}
