// ES module version of onBefore.js
import { loadCookies } from './loadCookies.js';

export default async (page, scenario, vp) => {
  await loadCookies(page, scenario);
};