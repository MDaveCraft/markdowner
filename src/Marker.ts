const TurndownService = require("turndown");
const { Readability } = require("@mozilla/readability");
var turndownService = new TurndownService();
turndownService.use(require("turndown-plugin-gfm").gfm);
turndownService.addRule("table", {
  filter: "table",
  replacement: (_content: any, node: any) => {
    const headers = Array.from(node.querySelectorAll("th")).map((th: any) =>
      th.textContent.trim()
    );

    const rows = Array.from(node.querySelectorAll("tr")).map((tr: any) =>
      Array.from(tr.querySelectorAll("td")).map((td: any) =>
        td.textContent.trim()
      )
    );

    let markdownTable = `| ${headers.join(" | ")} |\n`;
    markdownTable += `| ${headers.map(() => "---").join(" | ")} |\n`;
    rows.forEach((row) => {
      if (row.length) markdownTable += `| ${row.join(" | ")} |\n`;
    });

    return markdownTable;
  },
});

export default class Marker {
  private static addReadability(pageContent: Document | string): string {
    const reader = new Readability(pageContent, {
      nbTopCandidates: 1000,
      charThreshold: 0,
      keepClasses: true,
    });
    return reader.parse().content;
  }

  static toMarkdown(pageContent: Document | string, readability: boolean = false):string {
    if(readability) Marker.addReadability(pageContent);
    return turndownService.turndown(pageContent);
  }

  static async refineDown(md: string, baseURL: string):Promise<string> {
    md = await Marker.updateRelativeMarkdownLinks(md, baseURL);
    return md;
  }

  static async updateRelativeMarkdownLinks(md: string, baseUrl: string) {
    const regex = /\[(.*?)\]\((\/[^\)]+)\)/g;
    const updatedMarkdown = Promise.all(
      [...md.matchAll(regex)].map(
        async ([match, text, relativeUrl]) =>
          `[${text}](${new URL(relativeUrl, baseUrl).href})`
      )
    ).then((updatedLinks) =>
      md.replace(regex, () => updatedLinks.shift() as string)
    );
    return updatedMarkdown;
  }

  static convertMultiLineLinksToSingleLine(md: string): string {
    const regex = /\[([^\]]+?)\]\((\/[^\)]+)\)/g;
    const updatedMarkdown = md.replace(
      regex,
      (_match, text, relativeUrl) =>
        `[${text.replace(/\n+/g, " ").trim()}](${relativeUrl})`
    );
    return updatedMarkdown;
  }

  static lineBreakToSpace(md: string): string {
    const regex = /[\n\r]{2,}/g;
    return md.replace(regex, "\n");
  }

  static table(md: string) {
    const regex = /\|(.+?)\|/g;
    const rows = md.split("\n").filter((line) => regex.test(line));
    const table = rows.map(row => {
      const cells = row.split("|").map(cell => cell.trim());
      return `<tr>${cells.map(cell => `<td>${cell}</td>`).join("")}</tr>`;
    }).join('');
    return `<table>${table}</table>`;
  }
}