/** PM2 — run from project root: pm2 start ecosystem.config.cjs */
const port = process.env.PORT || 3010;

module.exports = {
  apps: [
    {
      name: process.env.PM2_NAME || "nimalsafari",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${port}`,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: String(port),
      },
      max_memory_restart: "512M",
    },
  ],
};