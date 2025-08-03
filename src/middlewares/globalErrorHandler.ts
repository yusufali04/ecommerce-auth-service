import { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";
import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger";
import path from "path";

export const globalErrorHandler = (
    err: HttpError,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction,
) => {
    const errorId = uuidv4();
    const statusCode = err.statusCode || err.status || 500;
    const isProduction = process.env.NODE_ENV === "prod";
    const message = isProduction ? "Internal Server Error" : err.message;

    logger.error(err.message, {
        errorId,
        errorStack: err.stack,
        path: req.path,
        method: req.method,
        statusCode,
    });
    res.status(statusCode).json({
        errors: [
            {
                ref: errorId,
                type: err.name,
                msg: message,
                path: req.path,
                method: req.method,
                location: path.basename(__filename),
                stack: isProduction ? undefined : err.stack,
            },
        ],
    });
};
