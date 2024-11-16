import PuppeteerControl from "./src/browser";

const browser = await PuppeteerControl.PuppetFactory();

console.log(
  await browser.fetch(
    "https://linkedin.com/in/dhravyashah",
    true
  )
);
