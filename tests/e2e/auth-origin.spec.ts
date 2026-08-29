import { expect, test } from "@playwright/test";

test("accepts 127.0.0.1 when auth uses localhost", async ({ request }) => {
  const baseURL = test.info().project.use.baseURL;
  const serverURL = new URL(typeof baseURL === "string" ? baseURL : "http://127.0.0.1:3101");
  const response = await request.post("/api/auth/sign-in/email", {
    data: {
      email: "missing-origin-test@example.test",
      password: "long-enough-password",
    },
    headers: {
      origin: serverURL.origin,
    },
  });
  const body = await response.json();

  expect(response.status()).not.toBe(403);
  expect(body.code).not.toBe("INVALID_ORIGIN");
});
