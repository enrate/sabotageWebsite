module.exports = {
  apps: [
    {
      name: 'arma-reforger-backend',
      script: './server/index.js',
      env: {
        NODE_ENV: 'production',
        REST_PORT: 5000,
        SOCKET_PORT: 5001
      },
      watch: false
    },
    {
      name: 'email-worker',
      script: './server/cron/emailWorker.js',
      env: {
        NODE_ENV: 'production'
      },
      watch: false
    },
    {
      name: 'season-awards-cron',
      script: './server/cron/issueSeasonAwards.js',
      env: {
        NODE_ENV: 'production'
      },
      watch: false
    }
  ]
}; 