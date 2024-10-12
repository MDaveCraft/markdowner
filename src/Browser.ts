import puppeteer, { Browser, Page } from "puppeteer";
import type { Env, DurableObject } from "./interfaces";

const KEEP_BROWSER_ALIVE_IN_SECONDS = 60;
const TEN_SECONDS = 10000;

const scripts = {
  turndownJs: "https://unpkg.com/turndown/dist/turndown.js",
  readabilityJs: "https://unpkg.com/@mozilla/readability@0.5.0/Readability.js",
} as const;

declare const Readability: any;
declare const TurndownService: any;


export default class PuppeteerControl {
  // keptAliveInSeconds: number = 0;
  // env: Env | undefined;
  // storage: DurableObject | undefined;
  // request: Request | undefined;
  // browser: Browser | undefined;
  // token: string = "";
  // llmFiltering: boolean = false;

  // private constructor(env: Env | undefined = undefined, storage: DurableObject | undefined = undefined) {
  //   this.env = env;
  //   this.storage = storage;
  //   this.initBrowser();
  // }

  // static PuppetFactory = (): PuppeteerControl => new PuppeteerControl();

  // private async initBrowser(){
  //   (!this.browser || !this.browser.connected) ?
  //     this.browser = await puppeteer.launch({ headless: true }) : null;
  // }

  static async extractLinks(page: Page, baseURL: string): Promise<string[]> {
    return await page.evaluate(
      (baseURL) =>
        [...new Set(Array.from(document.querySelectorAll("a")))]
          .map((link) => link.href)
          .filter((link) => link.startsWith(baseURL)),
      baseURL
    );
  }

  async fetchResponse(url: string, enabledDetailedResponse: boolean = true) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setBypassCSP(true);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.addScriptTag({ url: scripts.turndownJs });
    if(!enabledDetailedResponse) 
      await page.addScriptTag({ url: scripts.readabilityJs });

    let md: string = await page.evaluate(
      async (enabledDetailedResponse: boolean) => {

        function removeBrowserItems(): Document {
          const unnecessaryTags = ["script", "style", "noscript", "iframe"];
          let filteredDocument = document.cloneNode(true) as Document;
          unnecessaryTags.map((tag) =>
            filteredDocument
              .querySelectorAll(tag)
              .forEach((tag) => tag.remove())
          );
          return filteredDocument;
        }

        let pageContent: string | Document;

        if (enabledDetailedResponse) pageContent = removeBrowserItems();
        else {
          const reader = new Readability(document.cloneNode(true), {
            nbTopCandidates: 1000,
            charThreshold: 0,
            keepClasses: true,
          });
          pageContent = reader.parse().content;
        }
        const turndownService = new TurndownService();
        const markdown = turndownService.turndown(pageContent);
        return markdown;
      },
      enabledDetailedResponse
    );
    await browser.close();
    return md;
  }

  // private async alarm() {
  //   this.keptAliveInSeconds += 10;
  //   if (this.keptAliveInSeconds < KEEP_BROWSER_ALIVE_IN_SECONDS) {
  //     if(this.storage)
  //     await this.storage.setAlarm(Date.now() + TEN_SECONDS);
  //   } else {
  //     if (this.browser) {
  //       await this.browser.close();
  //       this.browser = undefined;
  //     }
  //   }
  // }
}