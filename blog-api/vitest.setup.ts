Object.assign(process.env, {
  NODE_ENV: 'test',
  AUTH_SECRET: 'test-secret-test-secret-test-secret-test-secret',
  AUTH_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/blog_test',
  DIRECT_URL: 'postgresql://user:password@localhost:5432/blog_test',
})
