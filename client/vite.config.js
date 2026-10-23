import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // 'spa' enables the history API fallback so deep links like
  // /admin/dashboard work on page refresh, not just client-side navigation.
  appType: "spa",
  server: {
    port: 5173,
    open: true,
  },
});
