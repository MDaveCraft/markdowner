export function buildResponse(html:string):Response {
  return new Response(html,{ 
    headers: {'content-type': 'text/html;charset=UTF-8'}
  });
}

export const isValidUrl = (url: string): boolean =>
  /^(http|https):\/\/[^ "]+$/.test(url);

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