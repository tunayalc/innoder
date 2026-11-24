import assert from 'node:assert/strict';
import test from 'node:test';
import {
  birthDate,
  csvCell,
  cvComplete,
  letterComplete,
  normalizeChecklist,
  pagination,
} from './workflow.js';
test('legacy boarding pass expands into two independent requirements', () => {
  assert.deepEqual(
    normalizeChecklist([{ id: 'bp', documentType: 'boarding_pass' }]).map(
      item => item.documentType,
    ),
    ['boarding_pass_outbound', 'boarding_pass_return'],
  );
});
test('pagination is opt in and bounded', () => {
  assert.equal(pagination({}).paged, false);
  assert.equal(pagination({ page: '2' }).pageSize, 25);
  assert.throws(() => pagination({ page: 1, pageSize: 101 }));
});
test('incomplete CV and motivation objects are not accepted as complete', () => {
  assert.equal(cvComplete({}), false);
  assert.equal(letterComplete({}), false);
});
test('birth date rejects rollover dates and future dates but supports clearing', () => {
  assert.equal(birthDate.safeParse('2025-02-31').success, false);
  assert.equal(birthDate.safeParse('2100-01-01').success, false);
  assert.equal(birthDate.safeParse('').success, true);
});
test('CSV formula prefixes and leading control characters are escaped', () => {
  for (const value of ['=1+1', '+cmd', '-1', '@SUM(A1)', ' \t=cmd'])
    assert.ok(csvCell(value).startsWith('"\''));
  assert.equal(csvCell('a"b'), '"a""b"');
});
