const request = require('supertest');
const app = require('../src/index');

test('healthz responde ok', async () => {
  const res = await request(app).get('/healthz');
  expect(res.statusCode).toBe(200);
});
