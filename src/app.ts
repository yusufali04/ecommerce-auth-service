import "reflect-metadata";
import express from "express";
import authRouter from "./routes/auth";
import cookieParser from "cookie-parser";
import tenantRouter from "./routes/tenant";
import userRouter from "./routes/user";
import cors from "cors";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { Config } from "./config";
const app = express();

const allowedOrigins: string[] = [
    Config.CLIENTUI_URL as string,
    Config.ADMINUI_URL as string,
];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie", "Cookie"],
};
app.use(cors(corsOptions));
app.use(express.static("public"));
app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/tenants", tenantRouter);
app.use("/users", userRouter);

app.get("/", (req, res) => {
    res.send("welcome to auth service");
});

app.use(globalErrorHandler);

export default app;
