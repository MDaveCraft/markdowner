import PuppeteerControl from "./src/Browser";

const browser = await PuppeteerControl.PuppetFactory();

console.log(await browser.fetch("https://www.shivamfabricon.com/", true));
