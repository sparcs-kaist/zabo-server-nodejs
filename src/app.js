import path from "path"
import createError from "http-errors"
import express from "express"
import session from "express-session"
import cookieParser from "cookie-parser"
import morgan from "morgan"
import helmet from "helmet"
import connectRedis from "connect-redis"

import routes from "./routes"

import "./db"

const app = express()
const RedisStore = connectRedis(session)

app.use(session({
	secret: process.env.SESSION_SECRET,
	cookie: { maxAge: 60000 },
	store: new RedisStore(),
	resave: false,
	saveUninitialized: true,
}));

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "Authorization, X-Requested-With, Content-Type, Accept")
	res.header("Access-Control-Allow-Methods", 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
	req.method === 'OPTIONS' ? res.send(200) : next()
})

app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.set("jwt-secret", process.env.JWT_SECRET)


app.use('/api', routes)

if (process.env.NODE_ENV === "development")
	app.use('/', express.static(__dirname + '/../../zabo-front-reactjs/deploy'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message
	res.locals.error = req.app.get('env') === 'development' ? err : {}

	res.status(err.status || 500)
	res.json({
		error: err
	})
})

app.set('port', 3000)

export default app
