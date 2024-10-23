import PuppeteerControl from "./src/browser";

const browser = await PuppeteerControl.PuppetFactory();

console.log(
  await browser.fetch(
    "https://netflixtechblog.com/investigation-of-a-workbench-ui-latency-issue-faa017b4653d"
  )
);