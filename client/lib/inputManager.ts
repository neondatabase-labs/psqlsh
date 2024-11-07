type InputEventCb = {
  left: (cursorPosition: number) => void;
  right: (cursorPosition: number) => void;
  up: () => void;
  down: () => void;
  enter: (text: string) => void;
  inputChange: (text: string, cursorPosition: number) => void;
};

export class InputManager {
  cursorPosition = 0;
  private callbacks: {
    [K in keyof InputEventCb]?: InputEventCb[K][];
  } = {};

  constructor(private inputNode: HTMLTextAreaElement) {}

  trigger<E extends keyof InputEventCb, A extends Parameters<InputEventCb[E]>>(
    event: E,
    ...args: A
  ) {
    this.callbacks[event]?.forEach((cb: any) => cb(...args));
  }

  on<E extends keyof InputEventCb>(
    event: E,
    cb: (...args: Parameters<InputEventCb[E]>) => void,
  ) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event]!.push(cb as any);
  }

  off<E extends keyof InputEventCb>(
    event: E,
    cb: (...args: Parameters<InputEventCb[E]>) => void,
  ) {
    this.callbacks[event] = this.callbacks[event]?.filter(
      (callback) => callback !== cb,
    ) as any;
  }

  resetText(text: string) {
    this.inputNode.value = text;
    this.cursorPosition = text.length;
    this.inputNode.setSelectionRange(this.cursorPosition, this.cursorPosition);
  }

  focus() {
    this.inputNode.focus();
  }

  init() {
    this.inputNode.addEventListener("keydown", async (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.cursorPosition = Math.max(0, this.cursorPosition - 1);
        this.inputNode.setSelectionRange(
          this.cursorPosition,
          this.cursorPosition,
        );
        this.trigger("left", this.cursorPosition);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        this.cursorPosition = Math.min(
          this.inputNode.value.length,
          this.cursorPosition + 1,
        );
        this.inputNode.setSelectionRange(
          this.cursorPosition,
          this.cursorPosition,
        );
        this.trigger("right", this.cursorPosition);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        this.trigger("up");
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        this.trigger("down");
      }
    });

    // @ts-expect-error
    this.inputNode.addEventListener("input", async (event: InputEvent) => {
      event.preventDefault();
      if (event.inputType === "insertLineBreak") {
        this.trigger("enter", this.inputNode.value);
      } else if (event.inputType === "deleteContentBackward") {
        this.cursorPosition = Math.max(0, this.cursorPosition - 1);
        this.trigger("inputChange", this.inputNode.value, this.cursorPosition);
      } else if (
        event.inputType === "insertText" ||
        event.inputType === "insertCompositionText"
      ) {
        this.cursorPosition++;
        this.trigger("inputChange", this.inputNode.value, this.cursorPosition);
      }
    });
    this.inputNode.addEventListener("paste", async (event) => {
      event.preventDefault();
      const text = event.clipboardData?.getData("text");
      if (text) {
        this.inputNode.value =
          this.inputNode.value.slice(0, this.cursorPosition) +
          text +
          this.inputNode.value.slice(this.cursorPosition);
        this.cursorPosition += text.length;
        this.trigger("inputChange", this.inputNode.value, this.cursorPosition);
      }
    });
    this.inputNode.focus();
  }
}
