// ES module version of clickAndHoverHelper.js
export const clickAndHoverHelper = async (page, scenario) => {
  const hoverSelector = scenario.hoverSelector;
  const clickSelector = scenario.clickSelector;
  const postInteractionWait = scenario.postInteractionWait; // ms

  if (hoverSelector) {
    await page.waitForSelector(hoverSelector);
    await page.hover(hoverSelector);
  }

  if (clickSelector) {
    await page.waitForSelector(clickSelector);
    await page.click(clickSelector);
  }

  if (postInteractionWait) {
    await page.waitForTimeout(postInteractionWait);
  }
};