import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
//May React be kind to me :))))

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
