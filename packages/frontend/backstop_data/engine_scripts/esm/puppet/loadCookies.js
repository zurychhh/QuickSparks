// ES module version of loadCookies.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const loadCookies = async (page, scenario) => {
  let cookies = [];
  const cookiePath = scenario.cookiePath;

  // Read cookies from file if it exists
  if (cookiePath && fs.existsSync(cookiePath)) {
    cookies = JSON.parse(fs.readFileSync(cookiePath));
  }

  // Add cookies to page
  const setCookies = async () => {
    return Promise.all(
      cookies.map(cookie => {
        return page.setCookie(cookie);
      })
    );
  };

  if (cookies.length) {
    await setCookies();
  }
};