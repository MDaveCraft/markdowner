export class DomManipulator {
  private doc: Document | null;

  private constructor(doc: Document) {
    this.doc = doc;
  }

  static Factory = (doc: Document) => new DomManipulator(doc);

  removeBrowserItems(): Document {
    const unnecessaryTags = ["script", "style", "noscript", "iframe", "br"];
    let filteredDocument = document.cloneNode(true) as Document;
    unnecessaryTags.map((tag) =>
      filteredDocument.querySelectorAll(tag).forEach((tag) => tag.remove())
    );
    return filteredDocument;
  }
  
  async toAbsoluteLinks(doc: Document, baseURL: string): Promise<Document> {
    const links = Array.from(doc.querySelectorAll("a")).map( link => link.href );
    const updatedLinks = await Promise.all(
      links.map(async (link) => new URL(link, baseURL).href)
    );
    doc.querySelectorAll("a").forEach(link => 
      link.href = updatedLinks.shift() as string);
    return doc;
  }
}