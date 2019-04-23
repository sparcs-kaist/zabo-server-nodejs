import path from "path"
import createError from "http-errors"
import express from "express"
import cookieParser from "cookie-parser"
import morgan from "morgan"
import helmet from "helmet"
import graphqlHTTP from "express-graphql"

import indexRouter from "./routes"

import { schema } from "./db/schema"
import { root as rootValue } from "./db/resolver"

const app = express()

app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))


app.use('/graphql', graphqlHTTP({
	schema,
	rootValue,
	graphiql: process.env.NODE_ENV === "development",
}))

app.use('/', indexRouter)

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
