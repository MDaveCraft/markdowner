const regexPattern = {
  url: /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/g
}

export function buildResponse(html:string):Response {
  return new Response(html,{ 
    headers: {'content-type': 'text/html;charset=UTF-8'}
  });
}

export const isValidUrl = (url: string): boolean => regexPattern.url.test(url);

export async function updateRelativeMarkdownLinks(md:string, baseUrl:string) {
  const regex = /\[(.*?)\]\((\/[^\)]+)\)/g;
  const updatedMarkdown = Promise.all(
    [...md.matchAll(regex)].map(
      async ([match,text, relativeUrl]) =>
        `[${text}](${new URL(relativeUrl, baseUrl).href})`
    )
  ).then(updatedLinks => md.replace(regex, () => updatedLinks.shift() as string));
  return updatedMarkdown;
}

export function convertMultiLineLinksToSingleLine(md:string): string {
  const regex = /\[([^\]]+?)\]\((\/[^\)]+)\)/g;
  const updatedMarkdown = md.replace(regex, (match, text, relativeUrl) => 
    `[${text.replace(/\n+/g, " ").trim()}](${relativeUrl})`
  );
  return updatedMarkdown;
}

export async function toAbsolute(doc: Document, baseURL: string): Promise<Document> {
  const links = Array.from(doc.querySelectorAll("a")).map(link => link.href);
  const updatedLinks = await Promise.all(
    links.map(async link => new URL(link, baseURL).href)
  );
  doc.querySelectorAll("a").forEach(
    link => link.href = updatedLinks.shift() as string
  );
  return doc;
}