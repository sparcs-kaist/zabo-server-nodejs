import path from "path";
import createError from "http-errors";
import express from "express";
import session from "express-session";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import Redis from "ioredis";
import connectRedis from "connect-redis";
import { adminRouter, adminRouterPath } from "./admin";

import routes from "./routes";

import { logger } from "./utils/logger";
import { isAdmin } from "./middlewares";

const app = express();
const RedisStore = connectRedis(session);
const redisClient = new Redis(process.env.REDIS_URL);

app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: { maxAge: 60 * 60 * 1000 },
    store: new RedisStore({ client: redisClient }),
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(
  cors({
    origin: [/sparcs\.org$/, /kaist\.ac\.kr$/],
    credentials: true,
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

// redirect to adminjs page
app.use(adminRouterPath, isAdmin, adminRouter);
logger.event.info(
  `AdminJS started on http://localhost:${process.env.PORT ||
    "6001"}${adminRouterPath}`,
);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  logger.api.error(err?.message || err); // TODO: Log params and body?
  res.status(err.status || 500);
  res.json({
    error: err, // 이거 뭐임? 왜 넣었지 ㅋㅋ 이거 없애도 되는거 아님? ㅋㅋ 이거 없애면 에러 안나는데 ㅋㅋ 이거 왜 넣었지 ㅋㅋ
  });
});

app.set("port", 3000);

export default app;
