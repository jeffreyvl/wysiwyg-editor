import { EditArea } from "./edit-area";
import { Toolbar } from "./toolbar";
import { ToolbarOptions, ActiveMode } from "./util";
import { InsertListBox } from "./insert-list-box";


export class htmlEditor {
  toolbarOptions: ToolbarOptions;
  editArea: EditArea;
  toolbar: Toolbar;
  insertListBox: InsertListBox;

  constructor(textArea: HTMLElement, editor: HTMLElement, toptoolbar: HTMLElement, bottomToolbar: HTMLElement, toolbarOptions: ToolbarOptions, mode: ActiveMode,
    insertListBox?: HTMLElement, insertListValues: string[] = []) {
    this.editArea = new EditArea(textArea, editor);
    this.toolbar = new Toolbar(toptoolbar, bottomToolbar, this.editArea, toolbarOptions);
    if (insertListValues.length > 0) {
      this.insertListBox = new InsertListBox(insertListBox, this.editArea, insertListValues);
    }
  }
}

