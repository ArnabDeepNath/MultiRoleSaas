import assert from "node:assert/strict";
import test from "node:test";
import { distanceKm, isValidGeoPoint, parseCoordinate } from "../src/lib/geo.ts";
import { includesFilter, matchesExactFilter, uniqueServiceValues } from "../src/lib/service-filters.ts";

test("distance is zero for identical coordinates and approximately 111 km per latitude degree", () => {
  const origin = { lat: 26.1445, lng: 91.7362 };
  assert.equal(distanceKm(origin, origin), 0);
  assert.ok(Math.abs(distanceKm(origin, { lat: 27.1445, lng: 91.7362 }) - 111.19) < 0.1);
});

test("coordinate validation enforces geographic bounds", () => {
  assert.equal(isValidGeoPoint({ lat: 26.1445, lng: 91.7362 }), true);
  assert.equal(isValidGeoPoint({ lat: 91, lng: 91.7362 }), false);
  assert.equal(isValidGeoPoint({ lat: 26.1445, lng: 181 }), false);
  assert.equal(isValidGeoPoint({ lat: Number.NaN, lng: 91.7362 }), false);
  assert.equal(parseCoordinate("26.1445", -90, 90), 26.1445);
  assert.equal(parseCoordinate("", -90, 90), null);
  assert.equal(parseCoordinate("100", -90, 90), null);
});

test("dynamic filter values are unique, trimmed, sorted, and exclude blanks", () => {
  const services = [
    { board: " State Board " },
    { board: "CBSE" },
    { board: "CBSE" },
    { board: "" },
    {},
  ];
  assert.deepEqual(uniqueServiceValues(services as never, "board"), ["CBSE", "State Board"]);
});

test("text and exact filters are case-insensitive", () => {
  assert.equal(includesFilter("City Prep School", "prep"), true);
  assert.equal(includesFilter("City Prep School", "other"), false);
  assert.equal(includesFilter(undefined, ""), true);
  assert.equal(matchesExactFilter(" CBSE ", "cbse"), true);
  assert.equal(matchesExactFilter("CBSE", "ICSE"), false);
  assert.equal(matchesExactFilter(undefined, ""), true);
});
