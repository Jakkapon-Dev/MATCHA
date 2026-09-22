import test from 'node:test';
import assert from 'node:assert/strict';
import { getFrontendUrl } from '../config/frontendUrl.js';

test('explicit FRONTEND_URL wins and is normalised', () => {
  assert.equal(
    getFrontendUrl({ FRONTEND_URL: 'https://shop.example///', CORS_ORIGINS: 'https://other.example' }),
    'https://shop.example'
  );
});

test('CORS_ORIGINS supplies the storefront when FRONTEND_URL is omitted', () => {
  assert.equal(
    getFrontendUrl({ CORS_ORIGINS: 'https://shop.example/, https://*-preview.vercel.app' }),
    'https://shop.example'
  );
});

test('wildcard-only CORS config does not become a customer link', () => {
  assert.equal(
    getFrontendUrl({ CORS_ORIGINS: 'https://*-preview.vercel.app' }),
    'http://localhost:5173'
  );
});
