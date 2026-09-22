import test from 'node:test';
import assert from 'node:assert/strict';
import DeletionRequest from '../models/DeletionRequest.js';

test('DeletionRequest declares only one userId index', () => {
  const userIdIndexes = DeletionRequest.schema
    .indexes()
    .filter(([keys]) => Object.keys(keys).length === 1 && keys.userId === 1);

  assert.equal(userIdIndexes.length, 1);
  assert.deepEqual(userIdIndexes[0][1], {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  });
});
