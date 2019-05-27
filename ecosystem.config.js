module.exports = {
	"apps": [
		{
			"name": "zabo-server",
			"script": "yarn start",
			"watch": true,
			"ignore_watch": ["node_modules"],
			"log_file": "combined.outerr.log",
			"out_file": "out.log",
			"error_file": "err.log",
			"merge_logs": true,
			"instances" : "max",
			"exec_mode" : "cluster",
			"env": {
				"NODE_ENV": "development",
			},
			"env_production": {
				"NODE_ENV": "production",
			},
		},
	],
}
