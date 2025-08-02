import { NextFunction, Response, Request } from "express";
import { TenantService } from "../services/TenantService";
import { Logger } from "winston";
import createHttpError from "http-errors";
import { matchedData } from "express-validator";
import { TenantQueryParams } from "../types";

export class TenantController {
    constructor(
        private readonly tenantService: TenantService,
        private readonly logger: Logger,
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
        const validatedQuery = matchedData(req, { onlyValidData: true });
        try {
            const [tenants, count] = await this.tenantService.getAll(
                validatedQuery as TenantQueryParams,
            );
            this.logger.info("All tenant have been fetched");
            res.json({
                perPage: validatedQuery.perPage,
                currentPage: validatedQuery.currentPage,
                total: count,
                data: tenants,
            });
        } catch (err) {
            next(err);
        }
    }
    async getOne(req: Request, res: Response, next: NextFunction) {
        const tenantId = req.params.id;

        if (isNaN(Number(tenantId))) {
            next(createHttpError(400, "Invalid url param."));
            return;
        }
        try {
            const tenant = await this.tenantService.getById(Number(tenantId));
            if (!tenant) {
                next(createHttpError(400, "Tenant does not exist."));
                return;
            }
            this.logger.info("Tenant has been fetched");
            res.json(tenant);
        } catch (err) {
            next(err);
        }
    }
    async update(req: Request, res: Response, next: NextFunction) {
        const { name, address } = req.body;
        const tenantId = req.params.id;

        if (isNaN(Number(tenantId))) {
            next(createHttpError(400, "Invalid url param."));
            return;
        }

        this.logger.debug("Request for updating a tenant", req.body);

        try {
            await this.tenantService.update(Number(tenantId), {
                name,
                address,
            });

            this.logger.info("Tenant has been updated", { id: tenantId });

            res.json({ id: Number(tenantId) });
        } catch (err) {
            next(err);
        }
    }
    async destroy(req: Request, res: Response, next: NextFunction) {
        const tenantId = req.params.id;

        if (isNaN(Number(tenantId))) {
            next(createHttpError(400, "Invalid url param."));
            return;
        }
        try {
            await this.tenantService.deleteById(Number(tenantId));

            this.logger.info("Tenant has been deleted", {
                id: Number(tenantId),
            });
            res.json({ id: Number(tenantId) });
        } catch (err) {
            next(err);
        }
    }
}
