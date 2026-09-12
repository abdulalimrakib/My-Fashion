/**
 * Who counts as a root administrator, and the rules for changing who else is
 * an administrator.
 */
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { hasRootAdmin, isRootAdminEmail, rootAdminEmails } from "../lib/admin/roles";

describe("rootAdminEmails", () => {
  const original = process.env.ROOT_ADMIN_EMAIL;

  beforeEach(() => {
    delete process.env.ROOT_ADMIN_EMAIL;
  });
  afterEach(() => {
    if (original === undefined) delete process.env.ROOT_ADMIN_EMAIL;
    else process.env.ROOT_ADMIN_EMAIL = original;
  });

  it("is empty when nothing is configured", () => {
    assert.deepEqual(rootAdminEmails(), []);
    assert.equal(hasRootAdmin(), false);
    assert.equal(isRootAdminEmail("anyone@example.com"), false);
  });

  it("reads a single address", () => {
    process.env.ROOT_ADMIN_EMAIL = "owner@example.com";
    assert.deepEqual(rootAdminEmails(), ["owner@example.com"]);
    assert.equal(isRootAdminEmail("owner@example.com"), true);
    assert.equal(isRootAdminEmail("someone@example.com"), false);
  });

  it("reads several, ignoring spacing and case", () => {
    process.env.ROOT_ADMIN_EMAIL = " Owner@Example.com , second@example.com ,, ";
    assert.deepEqual(rootAdminEmails(), ["owner@example.com", "second@example.com"]);
    assert.equal(isRootAdminEmail("OWNER@EXAMPLE.COM"), true);
    assert.equal(isRootAdminEmail("  second@example.com  "), true);
  });

  it("is read on every call, so the deployment environment wins", () => {
    process.env.ROOT_ADMIN_EMAIL = "first@example.com";
    assert.equal(isRootAdminEmail("first@example.com"), true);

    process.env.ROOT_ADMIN_EMAIL = "second@example.com";
    assert.equal(isRootAdminEmail("first@example.com"), false);
    assert.equal(isRootAdminEmail("second@example.com"), true);
  });

  it("treats a missing or empty address as nobody", () => {
    process.env.ROOT_ADMIN_EMAIL = "owner@example.com";
    assert.equal(isRootAdminEmail(null), false);
    assert.equal(isRootAdminEmail(undefined), false);
    assert.equal(isRootAdminEmail(""), false);
  });
});
