module.exports = {
	"apps": [
		{
			"name": "zabo-server",
			"script": "yarn start",
			"watch": true,
			"ignore_watch": ["node_modules"],
			"env": {
				"NODE_ENV": "development",
			},
			"env_production": {
				"NODE_ENV": "production",
			},
		},
	],
}
