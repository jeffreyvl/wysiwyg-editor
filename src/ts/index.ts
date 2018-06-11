import { EditArea } from "./edit-area";
import { Toolbar } from "./toolbar";
import { ToolbarOptions, ActiveMode } from "./util";
import { InsertListBox } from "./insert-list-box";
import { HtmlEditor } from "./html-editor";

export function createEditor(id: string, options: string = "full", mode: string = "design", showBottomToolbar: boolean = true,
    insertListValues: string[] = []): void {

    let toolbarOptions: ToolbarOptions = options.toLowerCase() === "simple" ? ToolbarOptions.Simple : ToolbarOptions.Full;
    let activeMode: ActiveMode = mode.toLowerCase() === "html" ? ActiveMode.Html : (mode.toLowerCase() === "preview" ? ActiveMode.Preview : ActiveMode.Design);
    
    let textArea: HTMLElement = document.getElementById(id);

    let height: number = $(textArea).height();
    height = Math.max(height, 60);
    $(textArea).height(height);

    let container: HTMLElement = $("<div/>").addClass("html-editor")[0];
    let main: HTMLElement = $("<div/>").addClass("main")[0];
    let toptoolbar: HTMLElement = $("<div/>").addClass("toolbar")[0]; 
    let editor: HTMLElement = $("<div/>").addClass("editable").height(height)[0];  
    let bottomToolbar: HTMLElement = $("<div/>").addClass("toolbar")[0];
    let insertListBox: HTMLElement = $('<div/>').addClass("insertlist")[0];    
    
    $(container).insertAfter(textArea).append(main);
    $(main).append(toptoolbar,editor,textArea,bottomToolbar);
    if (insertListValues.length > 0) {
        $(container).append(insertListBox);
        $(main).addClass("with-insertlist");
    }

    let htmlEditor: HtmlEditor = new HtmlEditor(textArea, editor, toptoolbar, bottomToolbar, showBottomToolbar,
        toolbarOptions, activeMode, insertListBox, insertListValues);

    $(insertListBox.firstChild).css("max-height",($(main).height()));
    activeEditors.push(htmlEditor);
}

export let activeEditors: HtmlEditor[] = [];

export function beforeSubmit():void {
    activeEditors.forEach( editor => {
        editor.editArea.beforeSubmit();
    })
}

export function getHtmlEditor(id:string) {
    let result:HtmlEditor = undefined;
    activeEditors.forEach( editor => {
        if (editor.uniqueId === id) {
            result = editor;
            return false;
        }
    })
    return result;
}
