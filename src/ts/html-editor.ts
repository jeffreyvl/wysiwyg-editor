import { EditArea } from "./edit-area";
import { Toolbar } from "./toolbar";
import { ToolbarOptions, ActiveMode } from "./util";
import { InsertListBox } from "./insert-list-box";


export class HtmlEditor {
  toolbarOptions: ToolbarOptions;
  editArea: EditArea;
  toolbar: Toolbar;
  insertListBox: InsertListBox;
  uniqueId:string;

  constructor(textArea: HTMLElement, editor: HTMLElement, toptoolbar: HTMLElement, bottomToolbar: HTMLElement, showBottomToolbar: boolean = true,
    toolbarOptions: ToolbarOptions = ToolbarOptions.Full, mode: ActiveMode = ActiveMode.Design, insertListBox?: HTMLElement, insertListValues: string[] = []) {
    this.uniqueId = textArea.id+"_html_editor";
    this.editArea = new EditArea(textArea, editor);
    this.toolbar = new Toolbar(toptoolbar, bottomToolbar, this.editArea, toolbarOptions, showBottomToolbar, mode);
    if (insertListValues.length > 0) {
      this.insertListBox = new InsertListBox(insertListBox, this.editArea, insertListValues);
    }
  }
}

