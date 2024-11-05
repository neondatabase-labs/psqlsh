export enum Color {
  Red = "#FF2B6A",
  Green = "#2BE5AD",
  Yellow = "#FFD73A",
}

export class TextChunk {
  constructor(
    private text: string,
    private color?: Color,
  ) {}

  html() {
    return `<span ${this.color ? `style="color: ${this.color}"` : ""}>${this.text}</span>`;
  }
}
