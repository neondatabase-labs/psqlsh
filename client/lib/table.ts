const DEFAULT_MAX_WIDTH = 30;
const APPROX_CHAR_WIDTH = 10;

function getScreenWidth() {
  const width = window.innerWidth;
  return Math.floor(width / APPROX_CHAR_WIDTH);
}

function alignCenter(text: string, width: number) {
  const padding = Math.max(Math.floor((width - text.length) / 2), 1);
  return (
    " ".repeat(padding) +
    text +
    " ".repeat(padding) +
    (padding === (width - text.length) / 2 ? "" : " ")
  ).slice(0, width);
}

function alignLeft(text: string, width: number) {
  return (text + " ".repeat(Math.max(width - text.length, 1))).slice(0, width);
}

function alignRight(text: string, width: number) {
  return (" ".repeat(Math.max(width - text.length, 1)) + text).slice(0, width);
}

class Column {
  constructor(readonly title: string) {}

  width() {
    // +2 for padding
    return this.title.length + 2;
  }
}

class Cell {
  private strValue: string;

  constructor(private value: unknown) {
    this.strValue =
      typeof value === "string"
        ? value
        : value instanceof Date
          ? value.toISOString()
          : JSON.stringify(value);
  }

  width() {
    return this.strValue.length;
  }

  span(width: number) {
    return Math.ceil((this.strValue.length + 2) / width);
  }

  print(width: number) {
    return typeof this.value === "number"
      ? alignRight(this.strValue, width)
      : alignLeft(this.strValue, width);
  }

  getLine(index: number, width: number) {
    if (this.span(width) === 1) {
      if (index === 0) {
        return this.print(width);
      } else {
        return " ".repeat(width);
      }
    } else {
      return alignLeft(
        this.strValue.slice(index * width, (index + 1) * width),
        width,
      );
    }
  }
}

class Row {
  cells: Cell[] = [];
}

export class Table {
  private columns: Column[] = [];
  private rows: Row[] = [];

  addColumn(title: string) {
    this.columns.push(new Column(title));
  }

  addRow() {
    const row = new Row();
    this.rows.push(row);
    return {
      addCell: (value: unknown) => {
        const cell = new Cell(value);
        const index = row.cells.push(cell) - 1;

        if (!this.columns[index]) {
          this.columns[index] = new Column(`?column?`);
        }
      },
    };
  }

  *print() {
    const maxWidth = Math.max(
      DEFAULT_MAX_WIDTH,
      getScreenWidth() / this.columns.length - 1,
    );
    const widths = this.columns.map((column) =>
      Math.min(column.width(), maxWidth),
    );
    for (const row of this.rows) {
      for (let i = 0; i < row.cells.length; i++) {
        const cell = row.cells[i];
        widths[i] = Math.min(Math.max(widths[i], cell.width()), maxWidth);
      }
    }
    yield this.columns
      .map((column, idx) => alignCenter(column.title, widths[idx]))
      .join("|");
    yield this.columns.map((_, idx) => "-".repeat(widths[idx])).join("|");
    for (const row of this.rows) {
      let span = 1;
      let currentRow: string[] = [];
      for (let i = 0; i < row.cells.length; i++) {
        const width = widths[i];
        const cell = row.cells[i];
        span = Math.max(span, row.cells[i].span(width));
        currentRow.push(cell.getLine(0, width));
      }
      yield currentRow.join("|");
      for (let i = 1; i < span; i++) {
        currentRow = [];
        for (let j = 0; j < row.cells.length; j++) {
          currentRow.push(row.cells[j].getLine(i, widths[j]));
        }
        yield currentRow.join("|");
      }
      yield this.columns.map((_, idx) => "-".repeat(widths[idx])).join("|");
    }
    yield `(${this.rows.length} row${this.rows.length === 1 ? "" : "s"})`;
  }
}
