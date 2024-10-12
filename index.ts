import PuppeteerControl from "./src/browser";


console.log(
  await new PuppeteerControl().fetchResponse(
    "https://pptr.dev/api/puppeteer.page.setbypasscsp"  )
);