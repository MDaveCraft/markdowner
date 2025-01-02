import PuppeteerControl from "./src/browser";

const browser = await PuppeteerControl.PuppetFactory();

console.log(await browser.fetch("https://www.shivamfabricon.com/", true));