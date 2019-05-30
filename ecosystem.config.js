module.exports = {
	"apps": [
		{
			"name": "zabo-server",
			"script": "./index.js",
			"watch": true,
			"ignore_watch": ["node_modules"],
			"log_file": "~/.pm2/logs/zabo-server-combined.log",
			//"instances" : "max",
			//"exec_mode" : "cluster",
			//"merge_logs": true,
			"env": {
				"NODE_ENV": "development",
			},
			"env_production": {
				"NODE_ENV": "production",
			},
		},
	],
}
