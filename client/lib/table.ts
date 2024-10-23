const MAX_COLUMN_WIDTH = 30;

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
  private _width = 0;

  get width() {
    return this._width;
  }

  set width(value: number) {
    this._width = Math.min(value, MAX_COLUMN_WIDTH);
  }

  constructor(readonly title: string) {
    this.width = title.length + 2;
  }
}

class Cell {
  private _width = 0;
  get width() {
    return this._width;
  }
  set width(value: number) {
    this._width = Math.min(value, MAX_COLUMN_WIDTH);
  }
  private strValue: string;

  constructor(private value: unknown) {
    this.strValue =
      typeof value === "string"
        ? value
        : value instanceof Date
          ? value.toISOString()
          : JSON.stringify(value);
    this.width = this.strValue.length;
  }

  span() {
    return Math.ceil((this.strValue.length + 2) / this.width);
  }

  print() {
    return typeof this.value === "number"
      ? alignRight(this.strValue, this.width)
      : alignLeft(this.strValue, this.width);
  }

  getLine(index: number) {
    if (this.span() === 1) {
      if (index === 0) {
        return this.print();
      } else {
        return " ".repeat(this.width);
      }
    } else {
      return alignLeft(
        this.strValue.slice(index * this.width, (index + 1) * this.width),
        this.width,
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
        this.columns[index].width = Math.max(
          this.columns[index].width,
          cell.width,
        );
      },
    };
  }

  *print() {
    yield this.columns
      .map((column) => alignCenter(column.title, column.width))
      .join("|");
    yield this.columns.map((column) => "-".repeat(column.width)).join("|");
    for (const row of this.rows) {
      let span = 1;
      let currentRow: string[] = [];
      for (let i = 0; i < row.cells.length; i++) {
        const width = this.columns[i].width;
        const cell = row.cells[i];
        cell.width = width;
        span = Math.max(span, row.cells[i].span());
        currentRow.push(cell.getLine(0));
      }
      yield currentRow.join("|");
      for (let i = 1; i < span; i++) {
        currentRow = [];
        for (let j = 0; j < row.cells.length; j++) {
          currentRow.push(row.cells[j].getLine(i));
        }
        yield currentRow.join("|");
      }
      yield this.columns.map((column) => "-".repeat(column.width)).join("|");
    }
    yield `(${this.rows.length} row${this.rows.length === 1 ? "" : "s"})`;
  }
}
