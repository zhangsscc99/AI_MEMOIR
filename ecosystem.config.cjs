const path = require("path");

module.exports = {
  apps: [
    {
      name: "aimemoir-backend",
      script: "src/app.js",
      cwd: path.join(__dirname, "backend"),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        FRONTEND_PORT: "3020",
      },
      error_file: path.join(__dirname, "logs/backend-err.log"),
      out_file: path.join(__dirname, "logs/backend-out.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true,
    },
    {
      name: "aimemoir-frontend",
      script: "/root/.nvm/versions/node/v24.5.0/bin/serve",
      args: ["-s", ".", "-l", "3020"],
      interpreter: "none",
      cwd: path.join(__dirname, "frontend"),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      error_file: path.join(__dirname, "logs/frontend-err.log"),
      out_file: path.join(__dirname, "logs/frontend-out.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true,
    },
  ],
};
