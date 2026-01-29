import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for React + JS (ignores TypeScript in node_modules)
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: "jsx",                // Treat files as JS/JSX
    include: /src\/.*\.jsx?$/,    // Only compile JS/JSX inside src
    exclude: [/node_modules/],    // Ignore node_modules
  },
  server: {
    port: 5173,                   // Your dev server port
    open: true,                   // Open browser automatically
  },
  resolve: {
    extensions: [".js", ".jsx"],  // Only resolve JS/JSX files
  },
});