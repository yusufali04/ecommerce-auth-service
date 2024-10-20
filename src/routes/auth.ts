import express, { NextFunction, Request, Response } from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import logger from "../config/logger";
import registerValidator from "../validators/register-validator";
import loginValidator from "../validators/login-validator";
import { TokenService } from "../services/TokenService";
import { RefreshToken } from "../entity/RefreshToken";
import { CredentialService } from "../services/CredentialService";
import authenticate from "../middlewares/authenticate";
import { AuthRequest } from "../types";

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
const tokenService = new TokenService(refreshTokenRepo);
const credentialService = new CredentialService();
const authController = new AuthController(
    userService,
    logger,
    tokenService,
    credentialService,
);

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post(
    "/register",
    registerValidator,
    (req: Request, res: Response, next: NextFunction) => {
        void authController.register(req, res, next);
    },
);

router.post(
    "/login",
    loginValidator,
    (req: Request, res: Response, next: NextFunction) => {
        void authController.login(req, res, next);
    },
);

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get("/self", authenticate, (req: Request, res: Response) => {
    void authController.self(req as AuthRequest, res);
});

export default router;
