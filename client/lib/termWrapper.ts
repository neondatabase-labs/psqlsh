import { Color, TextChunk } from "./color";
import { InputManager } from "./inputManager";

export class TermWrapper {
  private currentLine!: HTMLDivElement;
  private currentLineBuffer: TextChunk[] = [];
  private currentLinePrompt: string = "";
  private promptMode: boolean = false;
  private promptText = "";
  private history: string[] = [];
  private historyIndex = 0;
  private undoHistoryLine = "";
  private newLineListeners: ((line: string) => void)[] = [];
  private keywords: Set<string> = new Set();

  constructor(
    private appNode: HTMLElement,
    private inputManager: InputManager,
  ) {}

  addLine() {
    this.inputManager.resetText("");
    const showCursor = this.currentLine?.classList.contains("cursor");
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
    const regex = /\W/g;
    const chunks: TextChunk[] = [];
    let currentIdx = 0;
    while (true) {
      const match = regex.exec(this.currentLinePrompt);
      const nextIdx = match ? match.index : this.currentLinePrompt.length;
      const word = this.currentLinePrompt.slice(currentIdx, nextIdx);
      chunks.push(
        new TextChunk(
          word,
          this.keywords.has(word.toLowerCase()) ? Color.LightGreen : undefined,
        ),
      );
      if (match) {
        chunks.push(new TextChunk(match[0]));
        currentIdx = nextIdx + 1;
      } else {
        break;
      }
    }

    this.currentLineBuffer = chunks;
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
        this.inputManager.cursorPosition -
        1 +
        (this.promptMode ? this.promptText.length - 1 : -1)
      ).toString(),
    );
  }

  init() {
    this.appNode.classList.add("terminal");
    this.addLine();

    this.inputManager.on("left", () => {
      if (this.promptMode) {
        this.renderCurrentLine();
      }
    });
    this.inputManager.on("right", () => {
      if (this.promptMode) {
        this;
        this.renderCurrentLine();
      }
    });
    this.inputManager.on("up", () => {
      if (this.promptMode && this.historyIndex > 0) {
        if (this.historyIndex === this.history.length) {
          this.undoHistoryLine = this.currentLinePrompt;
        }
        this.historyIndex--;
        this.currentLinePrompt = this.history[this.historyIndex];
        this.inputManager.resetText(this.currentLinePrompt);
        this.renderCurrentPrompt();
      }
    });
    this.inputManager.on("down", () => {
      if (this.promptMode && this.historyIndex < this.history.length) {
        this.historyIndex++;
        this.currentLinePrompt =
          this.historyIndex === this.history.length
            ? this.undoHistoryLine
            : this.history[this.historyIndex];
        this.inputManager.resetText(this.currentLinePrompt);
        this.renderCurrentPrompt();
        if (this.historyIndex === this.history.length) {
          this.undoHistoryLine = "";
        }
      }
    });
    this.inputManager.on("enter", () => {
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
      this.inputManager.resetText("");
    });
    this.inputManager.on("inputChange", (text) => {
      if (this.promptMode) {
        this.currentLinePrompt = text;
        this.renderCurrentPrompt();
      }
    });
    fetch("/keywords.json")
      .then((res) => res.json())
      .then(({ keywords }) => {
        this.keywords = new Set(keywords);
      });
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
    this.currentLinePrompt += text;
    this.currentLineBuffer.push(chunk);
    this.inputManager.resetText(this.currentLinePrompt);
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
