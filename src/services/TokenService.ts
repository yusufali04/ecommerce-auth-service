import { JwtPayload, sign } from "jsonwebtoken";
import createHttpError from "http-errors";
import { Config } from "../config";
import { User } from "../entity/User";
import { RefreshToken } from "../entity/RefreshToken";
import { Repository } from "typeorm";

export class TokenService {
    constructor(private readonly refreshTokenRepo: Repository<RefreshToken>) {}
    generateAccessToken(payload: JwtPayload) {
        if (!Config.PRIVATE_KEY) {
            const error = createHttpError(500, "SECRET_KEY is not set");
            throw error;
        }
        const accessToken = sign(payload, Config.PRIVATE_KEY, {
            algorithm: "RS256",
            expiresIn: "1h",
            issuer: "auth-service",
        });
        return accessToken;
    }

    generateRefreshToken(payload: JwtPayload) {
        const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
            algorithm: "HS256",
            expiresIn: "1y",
            issuer: "auth-service",
            jwtid: String(payload.id),
        });
        return refreshToken;
    }

    async persistRefreshToken(user: User) {
        const newRefreshToken = await this.refreshTokenRepo.save({
            user: user,
            expiresIn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        });

        return newRefreshToken;
    }

    async deleteRefreshToken(tokenId: number) {
        return await this.refreshTokenRepo.delete({ id: tokenId });
    }
}
