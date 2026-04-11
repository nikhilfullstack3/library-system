module.exports = {
  apps: [
    {
      name: "library-api",
      script: "./index.js",
      cwd: "/var/www/libhook/server",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
      error_file: "/var/log/pm2/library-api-error.log",
      out_file: "/var/log/pm2/library-api-out.log",
      merge_logs: true,
    },
  ],
};
