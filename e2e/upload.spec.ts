import { test, expect } from "@playwright/test";

test("Upload page loads and shows upload UI", async ({ page }) => {
  await page.goto("/upload");
  await expect(page.getByText("Upload Study Material")).toBeVisible();
  await expect(
    page.getByText("Supported formats: PDF, DOCX, TXT, JPG, PNG")
  ).toBeVisible();
  // Add more UI and upload tests here
});

test("User can upload a PDF and sees success", async ({ page }) => {
  await page.goto("/upload");
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles("uploads/std7_Science_ch7.pdf");
  // Click the upload button (form submit)
  await page.getByRole("button", { name: /upload/i }).click();
  // Wait for the alert dialog and print its message
  const dialog = await page.waitForEvent("dialog");
  console.log("ALERT MESSAGE:", dialog.message());
  expect(dialog.message()).toMatch(/successfully|extracted/i);
  await dialog.dismiss();
  // Optionally, check for a UI change (e.g., topics displayed)
  // await expect(page.getByText(/topic|summary|key points/i)).toBeVisible();
});
