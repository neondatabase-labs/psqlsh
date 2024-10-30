import { Color, TextChunk } from "./color";

export class TermWrapper {
  private currentLine!: HTMLDivElement;
  private currentLineBuffer: TextChunk[] = [];
  private currentLinePrompt: string = "";
  private cursorPosition = 0;
  private promptMode: boolean = false;
  private promptText = "";
  private history: string[] = [];
  private historyIndex = 0;
  private undoHistoryLine = "";
  private newLineListeners: ((line: string) => void)[] = [];
  private inputNode: HTMLTextAreaElement | undefined;

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

  renderCurrentPrompt() {
    this.currentLineBuffer = [new TextChunk(this.currentLinePrompt)];
    this.renderCurrentLine();
  }

  renderCurrentLine() {
    this.currentLine.innerHTML = "";
    if (this.promptMode) {
      this.currentLine.textContent += this.promptText;
    }
    this.currentLine.innerHTML += this.currentLineBuffer
      .map((chunk) => chunk.html())
      .join("");
    this.appNode.style.setProperty(
      "--cursor-position",
      (
        this.cursorPosition -
        1 +
        (this.promptMode ? this.promptText.length - 1 : -1)
      ).toString(),
    );
  }

  focus() {
    this.inputNode?.focus();
  }

  init() {
    this.appNode.classList.add("terminal");
    this.addLine();

    const inputNode = document.createElement("textarea");
    this.inputNode = inputNode;
    inputNode.classList.add("terminal-input-hidden");
    inputNode.setAttribute("tabindex", "-1");
    document.body.addEventListener("click", () => {
      setTimeout(() => {
        inputNode.focus();
      }, 1);
    });
    this.appNode.appendChild(inputNode);

    inputNode.addEventListener("keydown", async (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (this.promptMode) {
          this.cursorPosition = Math.max(0, this.cursorPosition - 1);
          inputNode.setSelectionRange(this.cursorPosition, this.cursorPosition);
          this.renderCurrentLine();
        }
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (this.promptMode) {
          this.cursorPosition = Math.min(
            this.currentLinePrompt.length,
            this.cursorPosition + 1,
          );
          inputNode.setSelectionRange(this.cursorPosition, this.cursorPosition);
          this.renderCurrentLine();
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (this.promptMode && this.historyIndex > 0) {
          if (this.historyIndex === this.history.length) {
            this.undoHistoryLine = this.currentLinePrompt;
          }
          this.historyIndex--;
          this.currentLinePrompt = this.history[this.historyIndex];
          this.cursorPosition = this.currentLinePrompt.length;
          this.renderCurrentPrompt();
        }
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (this.promptMode && this.historyIndex < this.history.length) {
          this.historyIndex++;
          this.currentLinePrompt =
            this.historyIndex === this.history.length
              ? this.undoHistoryLine
              : this.history[this.historyIndex];
          this.cursorPosition = this.currentLinePrompt.length;
          this.renderCurrentPrompt();
          if (this.historyIndex === this.history.length) {
            this.undoHistoryLine = "";
          }
        }
      } else if (
        event.key === "v" &&
        (event.ctrlKey || event.metaKey) &&
        this.promptMode
      ) {
        event.preventDefault();
        const text = await navigator.clipboard.readText();
        if (text) {
          this.currentLinePrompt += text;
          this.cursorPosition += text.length;
          this.renderCurrentPrompt();
        }
      }
    });
    // @ts-expect-error
    inputNode.addEventListener("input", async (event: InputEvent) => {
      event.preventDefault();
      if (event.inputType === "insertLineBreak") {
        if (this.promptMode) {
          this.history.push(this.currentLinePrompt);
          this.historyIndex = this.history.length;
          this.undoHistoryLine = "";
        }
        this.newLineListeners.forEach((listener) =>
          listener(this.currentLinePrompt),
        );
        this.currentLineBuffer = [];
        this.currentLinePrompt = "";
        inputNode.value = "";
      } else if (
        event.inputType === "deleteContentBackward" &&
        this.promptMode
      ) {
        if (this.currentLinePrompt.length === 0) {
          return;
        }
        this.currentLinePrompt =
          this.currentLinePrompt.slice(0, this.cursorPosition - 1) +
          this.currentLinePrompt.slice(this.cursorPosition);
        this.cursorPosition--;
        this.renderCurrentPrompt();
      } else if (
        (event.inputType === "insertText" ||
          event.inputType === "insertCompositionText") &&
        this.promptMode
      ) {
        this.currentLinePrompt = inputNode.value;
        this.cursorPosition++;
        this.renderCurrentPrompt();
      }
    });
    inputNode.focus();
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

  write(text: string, color?: Color) {
    const chunk = new TextChunk(text, color);
    if (this.cursorPosition === this.currentLineBuffer.length) {
      this.currentLinePrompt += text;
      this.currentLineBuffer.push(chunk);
    } else {
      this.currentLineBuffer = [
        ...this.currentLineBuffer.slice(0, this.cursorPosition),
        chunk,
        ...this.currentLineBuffer.slice(this.cursorPosition),
      ];
      this.currentLinePrompt =
        this.currentLinePrompt.slice(0, this.cursorPosition) +
        text +
        this.currentLinePrompt.slice(this.cursorPosition);
    }
    this.cursorPosition += text.length;
    this.renderCurrentLine();
  }

  writeln(text: string, color?: Color) {
    this.write(text, color);
    this.currentLineBuffer = [];
    this.currentLinePrompt = "";
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
