/* eslint-disable @typescript-eslint/no-misused-promises */
import express from "express";
import authenticate from "../middlewares/authenticate";
import { canAccess } from "../middlewares/canAccess";
import { Roles } from "../constants";
import { UserController } from "../controllers/UserController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";

const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

const router = express.Router();

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    (req, res, next) => void userController.create(req, res, next),
);

export default router;
