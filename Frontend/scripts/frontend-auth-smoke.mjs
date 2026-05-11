import { chromium } from "playwright";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:3000";
const timestamp = Date.now();
const testUser = {
  name: `autoui_${timestamp}`,
  email: `autoui_${timestamp}@example.com`,
  password: "test1234",
};

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  try {
    console.log(`Starting UI flow on ${FRONTEND_URL}`);

    await page.goto(`${FRONTEND_URL}/register`, { waitUntil: "networkidle" });
    await page.getByLabel("Full Name").fill(testUser.name);
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Password", { exact: true }).fill(testUser.password);
    await page.getByLabel("Confirm Password").fill(testUser.password);
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL("**/onboarding", { timeout: 30000 });
    console.log("PASS: Registration redirected to onboarding");

    // Onboarding step 0 (welcome) -> next
    await page.getByRole("button", { name: "Next", exact: true }).click();
    // Step 1 categories
    await page.getByRole("button", { name: "Electronics" }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    // Step 2 budget
    await page.getByRole("button", { name: "Next", exact: true }).click();
    // Step 3 interests
    await page.getByRole("button", { name: "Finding deals" }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    // Step 4 complete
    await page.getByRole("button", { name: "Complete Setup" }).click();

    await page.waitForURL("**/dashboard", { timeout: 30000 });
    console.log("PASS: Onboarding completed and redirected to dashboard");
    if (pageErrors.length > 0) {
      throw new Error(`Dashboard runtime error: ${pageErrors[0]}`);
    }

    // New context to validate sign-in as a separate frontend session
    const loginContext = await browser.newContext();
    const loginPage = await loginContext.newPage();
    await loginPage.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle" });
    await loginPage.getByLabel("Email").fill(testUser.email);
    await loginPage.getByLabel("Password").fill(testUser.password);
    await loginPage.getByRole("button", { name: "Sign In" }).click();
    await loginPage.waitForURL("**/dashboard", { timeout: 30000 });
    console.log("PASS: Sign-in redirected to dashboard");
    await loginContext.close();

    console.log(`TEST_USER_EMAIL=${testUser.email}`);
    console.log(`TEST_USER_PASSWORD=${testUser.password}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
