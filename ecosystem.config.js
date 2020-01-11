module.exports = {
  apps: [
    {
      name: 'SERVER',
      script: 'index.js',
      watch: ['src'],
      ignore_watch: ['node_modules'],
      exec_mode: 'cluster',
      instances: 2,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      logs: './combined.log',
      merge_logs: true,
      args: [
        '--color',
      ],
    },
  ],
};
