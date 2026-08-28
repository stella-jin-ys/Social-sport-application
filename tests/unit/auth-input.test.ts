import { signUpInput } from "@/lib/auth";

describe("signUpInput", () => {
  it("requires a valid email and an eight-character password", () => {
    expect(
      signUpInput.safeParse({ name: "Ada", email: "bad", password: "short" })
        .success,
    ).toBe(false);
    expect(
      signUpInput.safeParse({
        name: "Ada",
        email: "ada@example.test",
        password: "long-enough",
      }).success,
    ).toBe(true);
  });
});
