module.exports = {
  apps: [
    {
      name: 'SERVER',
      script: 'index.js',
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
    {
      name: 'WORKER',
      script: 'worker.js',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      logs: './worker.log',
      merge_logs: true,
      args: [
        '--color',
      ],
    },
  ],
};
