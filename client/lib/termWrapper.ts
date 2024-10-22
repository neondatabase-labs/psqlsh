export class TermWrapper {
  private currentLine!: HTMLDivElement;
  private currentLineBuffer = "";
  private cursorPosition = 0;
  private promptMode: boolean = false;
  private promptText = "";
  private history: string[] = [];
  private historyIndex = 0;
  private undoHistoryLine = "";

  private newLineListeners: ((line: string) => void)[] = [];

  constructor(private appNode: HTMLElement) {}

  addLine() {
    this.cursorPosition = 0;
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
    this.appNode.scrollTop = this.appNode.scrollHeight;
  }

  renderCurrentLine() {
    this.currentLine.textContent = "";
    if (this.promptMode) {
      this.currentLine.textContent += this.promptText;
    }
    this.currentLine.textContent += this.currentLineBuffer;
    this.appNode.style.setProperty(
      "--cursor-position",
      (
        this.cursorPosition -
        1 +
        Number(this.promptMode) * (this.promptText.length - 1)
      ).toString(),
    );
  }

  init() {
    this.addLine();
    this.appNode.classList.add("terminal");
    this.appNode.addEventListener("keydown", (event) => {
      event.preventDefault();
      if (event.key === "Enter") {
        if (this.promptMode) {
          this.history.push(this.currentLineBuffer);
          this.historyIndex = this.history.length;
          this.undoHistoryLine = "";
        }
        this.newLineListeners.forEach((listener) =>
          listener(this.currentLineBuffer),
        );
        this.currentLineBuffer = "";
      } else if (event.key === "Backspace" && this.promptMode) {
        if (this.currentLineBuffer.length === 0) {
          return;
        }
        this.currentLineBuffer =
          this.currentLineBuffer.slice(0, this.cursorPosition - 1) +
          this.currentLineBuffer.slice(this.cursorPosition);
        this.cursorPosition--;
        this.renderCurrentLine();
      } else if (event.key === "ArrowLeft") {
        if (this.promptMode) {
          this.cursorPosition = Math.max(0, this.cursorPosition - 1);
          this.renderCurrentLine();
        }
      } else if (event.key === "ArrowRight") {
        if (this.promptMode) {
          this.cursorPosition = Math.min(
            this.currentLineBuffer.length,
            this.cursorPosition + 1,
          );
          this.renderCurrentLine();
        }
      } else if (event.key === "ArrowUp") {
        if (this.promptMode && this.historyIndex > 0) {
          if (this.historyIndex === this.history.length) {
            this.undoHistoryLine = this.currentLineBuffer;
          }
          this.historyIndex--;
          this.currentLineBuffer = this.history[this.historyIndex];
          this.cursorPosition = this.currentLineBuffer.length;
          this.renderCurrentLine();
        }
      } else if (event.key === "ArrowDown") {
        if (this.promptMode && this.historyIndex < this.history.length) {
          this.historyIndex++;
          this.currentLineBuffer =
            this.historyIndex === this.history.length
              ? this.undoHistoryLine
              : this.history[this.historyIndex];
          this.cursorPosition = this.currentLineBuffer.length;
          this.renderCurrentLine();
          if (this.historyIndex === this.history.length) {
            this.undoHistoryLine = "";
          }
        }
      } else if (
        event.key !== "Tab" &&
        event.key !== "Shift" &&
        event.key !== "Control" &&
        event.key !== "Alt" &&
        event.key !== "Meta" &&
        event.ctrlKey === false &&
        event.metaKey === false &&
        this.promptMode
      ) {
        this.currentLineBuffer =
          this.currentLineBuffer.slice(0, this.cursorPosition) +
          event.key +
          this.currentLineBuffer.slice(this.cursorPosition);
        this.cursorPosition++;
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
        this.cursorPosition += text.length;
        this.renderCurrentLine();
      }
    });
    this.appNode.focus();
  }

  startPromptMode(promptText: string = "") {
    this.promptText = promptText;
    this.promptMode = true;
    this.appNode.classList.add("prompt-mode");
    this.renderCurrentLine();
  }

  stopPromptMode() {
    this.promptMode = false;
    this.appNode.classList.remove("prompt-mode");
  }

  write(text: string) {
    if (this.cursorPosition === this.currentLineBuffer.length) {
      this.currentLineBuffer += text;
    } else {
      this.currentLineBuffer =
        this.currentLineBuffer.slice(0, this.cursorPosition) +
        text +
        this.currentLineBuffer.slice(this.cursorPosition);
    }
    this.cursorPosition += text.length;
    this.renderCurrentLine();
  }

  writeln(text: string) {
    this.write(text);
    this.currentLineBuffer = "";
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
