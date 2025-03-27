// ES module version of onReady.js
import { clickAndHoverHelper } from './clickAndHoverHelper.js';

export default async (page, scenario, vp) => {
  console.log('SCENARIO > ' + scenario.label);
  await clickAndHoverHelper(page, scenario);

  // add more ready handlers here...
};