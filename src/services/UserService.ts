import { LimitedUserData, UserData } from "../types";
import { User } from "../entity/User";
import { Repository } from "typeorm";
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
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: role,
                tenant: tenantId ? { id: Number(tenantId) } : undefined,
            });
        } catch (err) {
            const error = createHttpError(
                500,
                `Failed to store data in the database: ${
                    (err as Error).message
                }`,
            );
            throw error;
        }
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
        });
    }
    async update(
        userId: number,
        { firstName, lastName, role }: LimitedUserData,
    ) {
        try {
            return await this.userRepository.update(userId, {
                firstName,
                lastName,
                role,
            });
        } catch (err) {
            const error = createHttpError(
                500,
                `Failed to update the user in the database: ${
                    (err as Error).message
                }`,
            );
            throw error;
        }
    }
    async findById(id: number) {
        return await this.userRepository.findOne({
            where: { id },
        });
    }
    async getAll() {
        return await this.userRepository.find();
    }
    async deleteById(userId: number) {
        return await this.userRepository.delete(userId);
    }
}
