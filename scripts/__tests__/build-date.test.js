const assert = require("node:assert/strict");
const test = require("node:test");

const { getKoreaBuildDate } = require("../build-date");

test("formats the build date as YY.MM.DD in Korea", () => {
  assert.equal(
    getKoreaBuildDate(new Date("2026-09-06T03:00:00.000Z")),
    "26.09.06",
  );
});

test("uses the Korea date when UTC is still on the previous day", () => {
  assert.equal(
    getKoreaBuildDate(new Date("2026-09-05T15:00:00.000Z")),
    "26.09.06",
  );
});

test("rejects an invalid date", () => {
  assert.throws(
    () => getKoreaBuildDate(new Date("invalid")),
    /valid Date/,
  );
});
