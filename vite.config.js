import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': 'http://127.0.0.1:4175',
    },
  },
  plugins: [{
    name: 'showroom-local-surface-routing',
    configureServer(server) {
      const surface = process.env.SHOWROOM_SURFACE;
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url || '/', 'http://localhost').pathname;
        if (surface === 'public' && pathname === '/admin.html') {
          res.statusCode = 404;
          res.end('The admin dashboard runs at http://127.0.0.1:5174/admin.html');
          return;
        }
        if (surface === 'admin' && (pathname === '/' || pathname === '/index.html')) {
          res.statusCode = 302;
          res.setHeader('Location', '/admin.html');
          res.end();
          return;
        }
        next();
      });
    },
  }],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
});
