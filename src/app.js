import path from "path";
import createError from "http-errors";
import express from "express";
import session from "express-session";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import Redis from "ioredis";
import connectRedis from "connect-redis";

import routes from "./routes";

import "./db";

import { logger } from "./utils/logger";

const app = express();
const RedisStore = connectRedis(session);
const redisClient = new Redis(process.env.REDIS_URL);

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
