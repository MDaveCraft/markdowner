import puppeteer, { Browser, Page } from "puppeteer";
import type { Env, DurableObject } from "./interfaces";
import { convertMultiLineLinksToSingleLine, updateRelativeMarkdownLinks } from "./utils";
const KEEP_BROWSER_ALIVE_IN_SECONDS = 60;
const TEN_SECONDS = 10000;

declare const Readability: any;
declare const TurndownService: any;
declare const turndownPluginGfm:any;

export default class PuppeteerControl {
  keptAliveInSeconds: number = 0;
  env: Env | undefined;
  storage: DurableObject | undefined;
  request: Request | undefined;
  browser: Browser | null = null;
  token: string = "";
  llmFiltering: boolean = false;

  private constructor(env: Env | undefined = undefined, storage: DurableObject | undefined = undefined) {
    this.env = env;
    this.storage = storage;
  }

  static PuppetFactory = async () => {
    const browser = new PuppeteerControl();
    await browser.initBrowser();
    return browser;
  };

  private async initBrowser(){
    try {
      !this.browser || !this.browser.connected
        ? (this.browser = await puppeteer.launch())
        : null;
    } catch (error) {
      console.error(error);
    }
  }

  static async extractLinks(page: Page, baseURL: string): Promise<string[]> {
    return await page.evaluate(
      (baseURL) =>
        [...new Set(Array.from(document.querySelectorAll("a")))]
          .map((link) => link.href)
          .filter((link) => link.startsWith(baseURL)),
      baseURL
    );
  }

  async fetchResponse(url: string, enabledDetailedResponse: boolean = true): Promise<string | null> {
    if(!this.browser) return null;
    const page = await this.browser.newPage();
    await page.setBypassCSP(true);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: "networkidle0" });

    let md: string = await page.evaluate(
      async (enabledDetailedResponse: boolean) => {
        const scripts = {
          turndownJs: "https://unpkg.com/turndown/dist/turndown.js",
          readabilityJs:
            "https://unpkg.com/@mozilla/readability@0.5.0/Readability.js",
          turndownGFM:
            "https://unpkg.com/turndown-plugin-gfm/dist/turndown-plugin-gfm.js",
        } as const;

        const loadScript = (url: string) =>
          new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });

        function removeBrowserItems(): Document {
          const unnecessaryTags = ["script", "style", "noscript", "iframe","br"];
          let filteredDocument = document.cloneNode(true) as Document;
          unnecessaryTags.map(tag =>
            filteredDocument
              .querySelectorAll(tag)
              .forEach(tag => tag.remove())
          );
          return filteredDocument;
        }
        
        let pageContent: string | Document;
        await loadScript(scripts.turndownJs);
        await loadScript(scripts.turndownGFM);
        if (enabledDetailedResponse) pageContent = removeBrowserItems();
        else {
          await loadScript(scripts.readabilityJs);
          const reader = new Readability(document.cloneNode(true), {
            nbTopCandidates: 1000,
            charThreshold: 0,
            keepClasses: true,
          });
          pageContent = reader.parse().content;
        }
        const turndownService = new TurndownService();
        turndownService.use(turndownPluginGfm.gfm);
        const markdown = turndownService.turndown(pageContent);
        return markdown;
      },
      enabledDetailedResponse
    );
    await page.close();
    await this.browser.close();
    md = await this.refineDown(md,url);
    return md;
  }

  async refineDown(md:string,url:string) {
    md = await convertMultiLineLinksToSingleLine(md);
    md = await updateRelativeMarkdownLinks(md,url);
    return md;
  }

  private async alarm() {
    this.keptAliveInSeconds += 10;
    if (this.keptAliveInSeconds < KEEP_BROWSER_ALIVE_IN_SECONDS) {
      if(this.storage)
      await this.storage.setAlarm(Date.now() + TEN_SECONDS);
    } else {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }
}