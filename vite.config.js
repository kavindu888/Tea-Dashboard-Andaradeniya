import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://68.178.166.190:4125",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://68.178.166.190:4125",
        ws: true,
      },
    },
  },
});
