class InputController {
  private currentBuffer: string = "";
  private newLineListeners: ((line: string) => void)[] = [];

  init() {
    window.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.newLineListeners.forEach((listener) => listener(this.currentBuffer));
        this.currentBuffer = "";
      } else if (event.key === "Backspace") {
        if (this.currentBuffer.length === 0) {
          return;
        }
        this.currentBuffer = this.currentBuffer.slice(0, -1);
      } else if (event.key !== "Tab") {
        this.currentBuffer += event.key;
      }
    });
  }
