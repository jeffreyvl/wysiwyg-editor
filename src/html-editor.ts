import { EditArea } from "./edit-area";
import { Toolbar } from "./toolbar";
import { ToolbarOptions } from "./util";

export function createEditor(id:string, options:ToolbarOptions =  ToolbarOptions.Full): void {
    let textArea: HTMLElement = document.getElementById(id);
    let editor: HTMLElement = document.createElement("div");
    let toolbar: HTMLElement = document.createElement("div");
    let main: HTMLElement = document.createElement("div");
    let width:number = $(textArea).width();
    let height:number = $(textArea).height();

    $(main).addClass("html-editor");
    $(editor).addClass("editable").width(width).height(height);
    $(toolbar).addClass("toolbar").width(width);
    $(main).insertAfter(textArea).append(toolbar).append(editor).append(textArea);
    let editArea: EditArea = new EditArea(textArea,editor);
    // tslint:disable-next-line:no-unused-expression
    new Toolbar(toolbar,editArea, options);
}

