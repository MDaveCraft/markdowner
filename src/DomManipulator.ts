export class DomManipulator {

  static removeBrowserItems(doc: Document): Document {
    const unnecessaryTags = ["script", "style", "noscript", "iframe", "br"];
    doc.querySelectorAll(unnecessaryTags.join(",")).forEach(tag => tag.remove());
    return doc;
  }
  
  static async toAbsoluteLinks(doc: Document, baseURL: string): Promise<Document> {
    const links = Array.from(doc.querySelectorAll("a")).map( link => link.href );
    const updatedLinks = await Promise.all(
      links.map(async (link) => new URL(link, baseURL).href)
    );
    doc.querySelectorAll("a").forEach(link => 
      link.href = updatedLinks.shift() as string);
    return doc;
  }
}