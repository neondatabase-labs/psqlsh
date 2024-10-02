export class TermWrapper {
  private currentLine!: HTMLDivElement;
  private currentLineBuffer: string = "";

  private promptMode: boolean = false;

  private newLineListeners: ((line: string) => void)[] = [];

  constructor(private appNode: HTMLElement) {}

  addLine() {
    let showCursor = this.currentLine?.classList.contains("cursor");
    if (showCursor) {
      this.hideCursor();
    }
    if (this.currentLine) {
      const br = document.createElement("br");
      this.appNode.appendChild(br);
    }
    this.currentLine = document.createElement("div");
    this.currentLine.classList.add("line");
    this.appNode.appendChild(this.currentLine);
    if (showCursor) {
      this.showCursor();
    }
    this.renderCurrentLine();
  }

  renderCurrentLine() {
    this.currentLine.textContent = "";
    if (this.promptMode) {
      this.currentLine.textContent += "> ";
    }
    this.currentLine.textContent += this.currentLineBuffer;
  }

  init() {
    this.addLine();
    this.appNode.classList.add("terminal");
    this.appNode.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.newLineListeners.forEach((listener) =>
          listener(this.currentLineBuffer),
        );
        this.currentLineBuffer = "";
      } else if (event.key === "Backspace" && this.promptMode) {
        if (this.currentLineBuffer.length === 0) {
          return;
        }
        this.currentLineBuffer = this.currentLineBuffer.slice(0, -1);
        this.renderCurrentLine();
      } else if (
        event.key !== "Tab" &&
        event.key !== "Shift" &&
        event.key !== "Control" &&
        event.key !== "Alt" &&
        event.ctrlKey === false &&
        this.promptMode
      ) {
        console.log("domEvent", event);
        this.currentLineBuffer += event.key;
        this.renderCurrentLine();
      }
    });
    this.appNode.addEventListener("paste", (event) => {
      if (!this.promptMode) {
        return;
      }
      event.preventDefault();
      const text = event.clipboardData?.getData("text");
      if (text) {
        this.currentLineBuffer += text;
        this.renderCurrentLine();
      }
    });
    this.appNode.focus();
  }

  startPromptMode() {
    this.promptMode = true;
    this.appNode.classList.add("prompt-mode");
    this.renderCurrentLine();
  }

  stopPromptMode() {
    this.promptMode = false;
    this.appNode.classList.remove("prompt-mode");
  }

  write(text: string) {
    this.currentLine.textContent += text;
  }

  writeln(text: string) {
    this.write(text);
    this.addLine();
  }

  public showCursor() {
    this.currentLine.classList.add("cursor");
  }

  public hideCursor() {
    this.currentLine.classList.remove("cursor");
  }

  public waitLine() {
    return new Promise<string>((resolve) => {
      this.newLineListeners.push(resolve);
    });
  }
}
