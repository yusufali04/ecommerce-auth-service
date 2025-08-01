import { LimitedUserData, UserData, UserQueryParams } from "../types";
import { User } from "../entity/User";
import { Brackets, Repository } from "typeorm";
import createHttpError from "http-errors";
import bcrypt from "bcryptjs";

export class UserService {
    constructor(private readonly userRepository: Repository<User>) {}
    async create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId,
    }: UserData) {
        const user = await this.userRepository.findOne({
            where: { email: email },
        });
        if (user) {
            const error = createHttpError(400, "Email already exists");
            throw error;
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return await this.userRepository.save({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: role,
            tenant: tenantId ? { id: Number(tenantId) } : undefined,
        });
    }

    async findByEmailWithPassword(email: string) {
        return await this.userRepository.findOne({
            where: { email },
            select: [
                "id",
                "firstName",
                "lastName",
                "email",
                "role",
                "password",
            ],
            relations: {
                tenant: true,
            },
        });
    }
    async update(
        userId: number,
        { firstName, lastName, role, email, tenantId }: LimitedUserData,
    ) {
        return await this.userRepository.update(userId, {
            firstName,
            lastName,
            role,
            email,
            tenant: tenantId ? { id: Number(tenantId) } : undefined,
        });
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: { id },
            relations: {
                tenant: true,
            },
        });
    }
    async getAll(validatedQuery: UserQueryParams) {
        const queryBuilder = this.userRepository.createQueryBuilder("user");
        if (validatedQuery.q) {
            const searchTerm = `%${validatedQuery.q}%`;
            queryBuilder.where(
                new Brackets((qb) => {
                    qb.where(
                        "CONCAT(user.firstName, ' ', user.lastName) ILIKE :searchTerm",
                        { searchTerm },
                    ).orWhere("user.email ILIKE :searchTerm", { searchTerm });
                }),
            );
        }
        if (validatedQuery.role) {
            queryBuilder.andWhere("user.role = :role", {
                role: validatedQuery.role,
            });
        }
        const result = await queryBuilder
            .skip((validatedQuery.currentPage - 1) * validatedQuery.perPage)
            .take(validatedQuery.perPage)
            .orderBy("user.id", "DESC")
            .leftJoinAndSelect("user.tenant", "tenant")
            .getManyAndCount();

        return result;
    }
    async deleteById(userId: number) {
        return await this.userRepository.delete(userId);
    }
}
