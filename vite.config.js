import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy lab-notes API to the Node lab server (aws-lambda-masterclass/lab-server.cjs)
    // when it is running; the frontend falls back to localStorage when it is not.
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        // Do not fail hard when the lab server is offline — let the app
        // use its localStorage fallback instead of a proxy error page.
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
            }
            res.end(JSON.stringify({ error: 'lab-server offline' }));
          });
        },
      },
    },
  },
});
