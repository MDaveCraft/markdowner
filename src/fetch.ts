import type { Page } from "puppeteer";

declare const Readability: any;
declare const TurndownService: any;
declare const turndownPluginGfm: any;

export default async function fetchResponse(
    page: Page,
    enabledDetailedResponse: boolean = false
  ): Promise<string> {
    
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
              (tr: any) => Array.from(tr.querySelectorAll("td")).map((td: any) =>
                td.textContent.trim()));

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
    return md;
  }