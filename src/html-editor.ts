import { EditArea } from "./edit-area";
import { Toolbar } from "./toolbar";
import { ToolbarOptions } from "./util";
import { InsertListBox } from "./insert-list-box";

export function createEditor(
  id: string,
  options: string = "full",
  insertListValues: string[] = []
): EditArea {
  let toolbarOptions: ToolbarOptions;
  if (options.toLowerCase().indexOf("full") !== -1) {
    toolbarOptions = ToolbarOptions.Full;
  } else {
    toolbarOptions = ToolbarOptions.Simple;
  }
  let textArea: HTMLElement = document.getElementById(id);
  let editor: HTMLElement = document.createElement("div");
  let toptoolbar: HTMLElement = document.createElement("div");
  let bottomToolbar: HTMLElement = document.createElement("div");

  let main: HTMLElement = document.createElement("div");
  let container: HTMLElement = document.createElement("div");
  let width: number = $(textArea).width();
  let height: number = $(textArea).height();
  $(main)
    .addClass("html-editor")
    .width(width);
  $(editor)
    .addClass("editable")
    .width(width)
    .height(height);
  $(toptoolbar)
    .addClass("toolbar")
    .width(width);
  $(bottomToolbar)
    .addClass("toolbar")
    .width(width);
  $(container)
    .insertAfter(textArea)
    .append(main)
    .addClass("html-editor-container")
    .addClass("group");
  $(main)
    .append(toptoolbar)
    .append(editor)
    .append(textArea)
    .append(bottomToolbar);
  let editArea: EditArea = new EditArea(textArea, editor);
  let toolbar: Toolbar = new Toolbar(
    toptoolbar,
    bottomToolbar,
    editArea,
    toolbarOptions
  );
  if (insertListValues.length > 0) {
    let insertListBox: HTMLElement = $("<div/>")
      .addClass("insertlist")
      .insertAfter(main)[0];
    // tslint:disable-next-line:no-unused-expression
    new InsertListBox(insertListBox, editArea, insertListValues);
  }
  return editArea;
}
