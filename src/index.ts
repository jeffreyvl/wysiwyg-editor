import { EditArea } from "./edit-area";
import { Toolbar } from "./toolbar";
import { ToolbarOptions, ActiveMode } from "./util";
import { InsertListBox } from "./insert-list-box";
import { htmlEditor } from "./html-editor";

export function createEditor(id: string, options: string = "full", mode: string = "design", insertListValues: string[] = []): htmlEditor {
    let toolbarOptions: ToolbarOptions = options.toLowerCase() === "simple" ? ToolbarOptions.Simple : ToolbarOptions.Full;
    let activeMode: ActiveMode = mode.toLowerCase() === "html" ? ActiveMode.Html : (mode.toLowerCase() === "preview" ? ActiveMode.Preview : ActiveMode.Design);
    let textArea: HTMLElement = document.getElementById(id);
    let width: number = insertListValues.length > 0 ? $(textArea).width() - 200 : $(textArea).width();
    let height: number = $(textArea).height();

    let editor: HTMLElement = $("<div/>").addClass("editable").width(width).height(height)[0];
    let toptoolbar: HTMLElement = $("<div/>").addClass("toolbar").width(width)[0];
    let bottomToolbar: HTMLElement = $("<div/>").addClass("toolbar").width(width)[0];
    let container: HTMLElement = $("<div/>").insertAfter(textArea).addClass("html-editor-container").addClass("group")[0];    
    let main: HTMLElement = $("<div/>").addClass("html-editor").width(width).append(toptoolbar).append(editor).append(textArea).append(bottomToolbar)[0];
    $(container).append(main);
    let insertListBox: HTMLElement = $('<div/>').addClass("insertlist").width(200)[0]

    if (insertListValues.length > 0) {
        $(insertListBox).insertAfter(main)[0];
    }

    return new htmlEditor(textArea,editor,toptoolbar,bottomToolbar,toolbarOptions,activeMode,insertListBox,insertListValues);
}
