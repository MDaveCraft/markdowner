import puppeteer, { Browser, Page } from "puppeteer";
import Marker from "./Marker";

declare const Readability: any;
declare const TurndownService: any;
declare const turndownPluginGfm: any;

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
          .map((link) => link.href)
          .filter((link) => link.startsWith(baseURL)),
      baseURL
    );
  }

  async fetch(
    url: string,
    enabledDetailedResponse: boolean = false
  ): Promise<string | null> {
    
    if (!this.browser) return null;
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
          new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
          });

        function removeBrowserItems(): Document {
          const unnecessaryTags = [
            "script",
            "style",
            "noscript",
            "iframe",
            "br",
          ];
          const filteredDocument = document.cloneNode(true) as Document;
          filteredDocument
            .querySelectorAll(unnecessaryTags.join(","))
            .forEach((tag) => tag.remove());
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

        turndownService.addRule("table", {
          filter: "table",
          replacement: (_content: any, node: any) => {
            const headers = Array.from(node.querySelectorAll("th")).map(
              (th: any) => th.textContent.trim()
            );

            const rows = Array.from(node.querySelectorAll("tr")).map(
              (tr: any) =>
                Array.from(tr.querySelectorAll("td")).map((td: any) =>
                  td.textContent.trim()
                )
            );

            let markdownTable = `| ${headers.join(" | ")} |\n`;
            markdownTable += `| ${headers.map(() => "---").join(" | ")} |\n`;

            rows.forEach(row => {
              if (row.length) markdownTable += `| ${row.join(" | ")} |\n`;
            });

            return markdownTable;
          },
        });

        const markdown = turndownService.turndown(pageContent);
        return markdown;
      },
      enabledDetailedResponse
    );
    await page.close();
    await this.browser.close();
    if(!enabledDetailedResponse)
    md = await this.refineDown(md, url);
    return md;
  }

  async refineDown(md: string, url: string) {
    md = Marker.lineBreakToSpace(md);
    md = Marker.convertMultiLineLinksToSingleLine(md);
    md = await Marker.updateRelativeMarkdownLinks(md, url);
    return md;
  }

  // static async newPage(browser: Browser, url: string) {
  //   if (!browser) {
  //     console.error("Browser instance is not provided.");
  //     return  ;
  //   }
  
  //   try {
  //     const page = await browser.newPage();
  //     await page.setBypassCSP(true);
  //     await page.setViewport({ width: 1920, height: 1080 });
  //     await page.goto(url, { waitUntil: "networkidle0" });
  
  //     return {
  //       page,
  //       [Symbol.dispose]: async () => {
  //         if (!page.isClosed()) {
  //           await page.close();
  //         }
  //       },
  //     };
  //   } catch (error) {
  //     console.error("Failed to create a new page:", error);
  //     return null;
  //   }
  // }

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
