import { test, expect } from '@playwright/test';

test('verify 3-column layout and scroll events', async ({ page }) => {
  await page.goto('http://localhost:5174');

  // Check left column
  await expect(page.getByText('Workspace')).toBeVisible();
  await expect(page.getByText('mock-document.md').first()).toBeVisible();

  // Check middle column
  await expect(page.locator('.markdown-reader')).toBeVisible();

  // Check right column tabs
  await expect(page.getByText('Knowledge Graph')).toBeVisible();
  await expect(page.getByText('Mindmap')).toBeVisible();
  await expect(page.getByText('Mermaid')).toBeVisible();

  // Check Graph Panel content
  await expect(page.getByText('Graph View')).toBeVisible();
  
  // Wait for the intersection observer to fire initially
  await page.waitForTimeout(1000);

  // Scroll down
  await page.evaluate(() => {
    const container = document.querySelector('.flex-1.overflow-y-auto');
    if (container) {
      container.scrollTop = 1000;
    }
  });

  await page.waitForTimeout(500);

  // Active anchor should not be empty
  const activeAnchorText = await page.locator('code').first().textContent();
  console.log('Active Anchor:', activeAnchorText);
  expect(activeAnchorText).not.toBe('None');
});
