import { config } from "dotenv";
import path from "path";
config({
    path: path.resolve(
        __dirname,
        `../../.env.${process.env.NODE_ENV || "dev"}`,
    ),
});

const {
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    REFRESH_TOKEN_SECRET,
    JWKS_URI,
    PRIVATE_KEY,
    CLIENTUI_URL,
    ADMINUI_URL,
} = process.env;
export const Config = {
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD: DB_PASSWORD,
    DB_NAME,
    REFRESH_TOKEN_SECRET,
    JWKS_URI,
    PRIVATE_KEY,
    CLIENTUI_URL,
    ADMINUI_URL,
};
