import { InputManager } from "./inputManager";

export type SelectOption = {
  value: string;
  description?: string;
};

export class Select {
  currentIndex = 0;
  selectNode: HTMLElement;
  private onChoice?: (option: SelectOption) => void;

  constructor(
    private appNode: HTMLElement,
    private inputManager: InputManager,
    private options: SelectOption[],
  ) {
    if (options.length === 0) {
      throw new Error("No options provided");
    }
    this.selectNode = document.createElement("div");
    this.selectNode.classList.add("select");
    this.appNode.appendChild(this.selectNode);
  }

  async pickOption() {
    this.selectNode.innerHTML = "";
    this.options.forEach((option, index) => {
      const optionNode = document.createElement("div");
      optionNode.classList.add("option");
      optionNode.dataset.index = index.toString();
      this.selectNode.appendChild(optionNode);
      const optionValueNode = document.createElement("div");
      optionValueNode.classList.add("option-value");
      optionValueNode.textContent = option.value;
      optionNode.appendChild(optionValueNode);
      if (option.description) {
        const optionDescriptionNode = document.createElement("div");
        optionDescriptionNode.classList.add("option-description");
        optionDescriptionNode.textContent = option.description;
        optionNode.appendChild(optionDescriptionNode);
      }
      optionNode.addEventListener("click", () => {
        if (this.onChoice) {
          this.onChoice(option);
        }
      });
    });

    this.registerHandlers();
    this.render();
    return new Promise<SelectOption>((resolve) => {
      this.onChoice = (option) => {
        this.unregisterHandlers();
        resolve(option);
      };
    });
  }

  onUp = () => {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.render();
    }
  };

  onDown = () => {
    if (this.currentIndex < this.options.length - 1) {
      this.currentIndex++;
      this.render();
    }
  };

  onEnter = () => {
    if (this.onChoice) {
      this.onChoice(this.options[this.currentIndex]);
    }
  };

  registerHandlers() {
    this.inputManager.on("up", this.onUp);
    this.inputManager.on("down", this.onDown);
    this.inputManager.on("enter", this.onEnter);
  }

  unregisterHandlers() {
    this.inputManager.off("up", this.onUp);
    this.inputManager.off("down", this.onDown);
    this.inputManager.off("enter", this.onEnter);
  }

  render() {
    const options = this.selectNode.querySelectorAll(".option");
    options.forEach((option, index) => {
      if (index === this.currentIndex) {
        option.classList.add("option-selected");
      } else {
        option.classList.remove("option-selected");
      }
    });
  }

  destroy() {
    this.unregisterHandlers();
    this.selectNode.remove();
  }
}
