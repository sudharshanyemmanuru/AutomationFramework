// @ts-check
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();
const APPURL=process.env.APPLICATION_URL;
const captureScreenshots=()=>{
  return process.env.CAPTURE_SCREENSHOTS==='on' ? 'on'
    : process.env.CAPTURE_SCREENSHOTS==='off' ? 'off'
    : process.env.CAPTURE_SCREENSHOTS==='only-failed' ? 'only-on-failure'
    : 'on-first-failure'
}
const HEADLESS_MODE=()=>{
  return process.env.HEADLESS==='true'
}
export default defineConfig({
  testDir: './e2e',
  reporter: 'html',
  //timeout:3000,
  fullyParallel: false,

  use: {
    screenshot:captureScreenshots(),
    video:'retain-on-failure',
    browserName:'chromium',
    headless:process.env.CI ? true: HEADLESS_MODE(),
    trace:'on-first-retry',
    baseURL:APPURL
  },
});

