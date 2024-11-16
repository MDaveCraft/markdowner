import puppeteer, { Browser, Page } from "puppeteer";
import Marker from "./Marker";
import fetchResponse from "./fetch";

export default class PuppeteerControl {
  request: Request | undefined;
  browser: Browser | null = null;

  static PuppetFactory = async () => {
    const browser = new PuppeteerControl();
    await browser.initBrowser();
    return browser;
  };

  private async initBrowser() {
    try {
      if (!this.browser || !this.browser.connected)
        this.browser = await puppeteer.launch();
    } catch (error) {
      console.error(error);
    }
  }

  static async extractLinks(page: Page, baseURL: string): Promise<string[]> {
    return await page.evaluate(
      (baseURL) =>
        [...new Set(Array.from(document.querySelectorAll("a")))]
          .map(link => link.href)
          .filter(link => link.startsWith(baseURL)),
      baseURL
    );
  }

  async fetch(url:string, enabledDetailedResponse:boolean = false): Promise<string | null> {
    if (!this.browser) return null;
    await using pageObj = await PuppeteerControl.newPage(this.browser, url);
    let md = await fetchResponse(pageObj.page, enabledDetailedResponse);
    await this.browser.close();
    if (enabledDetailedResponse) md = await Marker.refineDown(md, url);
    return md;
  }

  static async newPage(browser: Browser, url: string) {  
    try {
      const page = await browser.newPage();
      await page.setBypassCSP(true);
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, { waitUntil: "networkidle0" });
      return {
        page, [Symbol.asyncDispose]: async () => {
          if (!page.isClosed())
            await page.close();
        }
      };
    } catch (error:any) {
      throw new Error("Failed to create a new page:", error.message);
    }
  }

  // private async alarm() {
  //   this.keptAliveInSeconds += 10;
  //   if (this.keptAliveInSeconds < KEEP_BROWSER_ALIVE_IN_SECONDS) {
  //     if(this.storage)
  //     await this.storage.setAlarm(Date.now() + TEN_SECONDS);
  //   } else {
  //     if (this.browser) {
  //       await this.browser.close();
  //       this.browser = null;
  //     }
  //   }
  // }
}
