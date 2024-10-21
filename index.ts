import PuppeteerControl from "./src/browser";

const browser = await PuppeteerControl.PuppetFactory();

console.log(await browser.fetchResponse("https://climateprimer.mit.edu/"));
