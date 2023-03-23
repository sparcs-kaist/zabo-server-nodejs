import path from "path";
import createError from "http-errors";
import express from "express";
import session from "express-session";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import Redis from "ioredis";
import connectRedis from "connect-redis";

// FIXME Temporary add of admin js
import AdminJSExpress from "@adminjs/express";
import AdminJS from "adminjs";
import * as AdminJSMongoose from "@adminjs/mongoose";
import mongoose from "mongoose";
import {
  AdminUser,
  User,
  DeletedZabo,
  Board,
  Group,
  Statistic,
  PreRegister,
  Meta,
  Zabo,
} from "./db/index";
import { GroupResource } from "./admin/resources/Group";
//
import routes from "./routes";

import { logger } from "./utils/logger";

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

const app = express();
const RedisStore = connectRedis(session);
const redisClient = new Redis(process.env.REDIS_URL);

// FIXME Temporary add of admin js
const adminOptions = {
  resources: [
    AdminUser,
    User,
    DeletedZabo,
    Board,
    GroupResource,
    Group,
    Statistic,
    PreRegister,
    Meta,
    Zabo,
  ],
};
const admin = new AdminJS(adminOptions);
const adminRouter = AdminJSExpress.buildRouter(admin);
app.use(admin.options.rootPath, adminRouter);
console.log(
  `AdminJS started on http://localhost:6001${admin.options.rootPath}`,
);

//

app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: { maxAge: 60000 },
    store: new RedisStore({ client: redisClient }),
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(
  cors({
    origin: [/sparcs\.org$/, /kaist\.ac\.kr$/],
  }),
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("jwt-secret", process.env.JWT_SECRET);

app.get("/api/hc", (req, res) => {
  res.sendStatus(200);
});
app.use("/api", routes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  logger.api.error(err); // TODO: Log params and body?
  res.status(err.status || 500);
  res.json({
    error: err,
  });
});

app.set("port", 3000);

export default app;
