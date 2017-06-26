module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [

    // First application
    {
      name: "wechatautoReceipt",
      max_memory_restart: "1024M",
      log_date_format: "YYYY-MM-DD HH:mm:ss SSS",
      script: "index.js",
      out_file: "/var/log/wechatautoReceipt/app.log",
      error_file: "/var/log/wechatautoReceipt/err.log",
      port: "80",
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy: {
    production: {
      user: 'root',
      host: '116.62.195.14',
      ref: 'origin/master',
      repo: 'git@github.com:sqzxcv/wechatautoReceipt.git',
      path: '/var/www/wechatautoReceipt',
      "post-deploy": 'git pull && npm install && pm2 reload ecosystem.config.js --env production'
    },
    dev: {
      user: 'root',
      host: '116.62.195.14',
      ref: 'origin/master',
      repo: 'git@github.com:sqzxcv/videoservice.git',
      path: '/var/www/development',
      "post-deploy": 'npm install && pm2 reload ecosystem.config.js --env dev',
      env: {
        NODE_ENV: 'dev'
      }
    }
  }
};
