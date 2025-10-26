const { createProxyMiddleware } = require('http-proxy-middleware');

// NOTE:
// Backend mounts routes as:
// - app.use('/api', userRoutes)    -> expects '/api/...'
// - app.use('/auth', authRoutes)   -> expects '/auth/...'
// - app.get('/profile', ...)       -> expects '/profile'
// Frontend uses baseURL '/api' and calls:
// - '/users'            -> '/api/users' (should NOT rewrite)
// - '/auth/login'       -> '/api/auth/login' (MUST rewrite to '/auth/login')
// - '/auth/refresh'     -> '/api/auth/refresh' (MUST rewrite)
// - '/profile'          -> '/api/profile' (MUST rewrite to '/profile')

module.exports = function (app) {
  // Rewrite auth routes: /api/auth/* -> /auth/*
  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    })
  );

  // Rewrite profile route: /api/profile -> /profile
  app.use(
    '/api/profile',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    })
  );

  // All other /api calls (e.g., /api/users) should go through unchanged
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );
};