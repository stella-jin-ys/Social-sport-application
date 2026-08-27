import { beforeEach, expect, it } from "vitest";
import { clearPendingJoin, readPendingJoin, setPendingJoin } from "@/lib/pending-join";

beforeEach(() => window.sessionStorage.clear());

it("stores a same-group pending join in this tab", () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });

  expect(readPendingJoin()).toEqual({
    groupSlug: "soder-sparks",
    returnTo: "/groups/soder-sparks",
  });
});

it("rejects arbitrary or mismatched return paths", () => {
  expect(() => setPendingJoin({
    groupSlug: "soder-sparks",
    returnTo: "https://evil.example/groups/soder-sparks",
  })).toThrow();
  expect(() => setPendingJoin({
    groupSlug: "soder-sparks",
    returnTo: "/groups/parken-5-a-side",
  })).toThrow();
});

it("clears the intent without returning a membership side effect", () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });

  clearPendingJoin();

  expect(readPendingJoin()).toBeNull();
});
