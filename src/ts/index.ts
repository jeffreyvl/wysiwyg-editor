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

    let insertListBoxWidth = 200;

    let height: number = $(textArea).height();
    let width: number = $(textArea).width() - (insertListValues.length > 0 ? insertListBoxWidth : 0);

    height = Math.max(height, 60);
    width = Math.max(width, 150);

    $(textArea).width(width);
    
    let editorMain: HTMLElement = $("<div>").addClass("group").addClass("html-editor-main")[0];
    
    let insertListBox: HTMLElement = $('<div/>').addClass("insertlist").height(height).width(insertListBoxWidth)[0];
    let editor: HTMLElement = $("<div/>").addClass("editable").height(height).width(width)[0];
    let toptoolbar: HTMLElement = $("<div/>").addClass("toolbar").width(width)[0];
    let bottomToolbar: HTMLElement = $("<div/>").addClass("toolbar").width(width)[0];


    $("<div/>").addClass("html-editor-container").insertAfter(textArea)
        .append(toptoolbar).append(editorMain).append(bottomToolbar);

    $(editorMain).append(editor).append(textArea);

    if (insertListValues.length > 0) {
        $(editorMain).append(insertListBox);
    }

    let htmlEditor: HtmlEditor = new HtmlEditor(textArea, editor, toptoolbar, bottomToolbar, showBottomToolbar,
        toolbarOptions, activeMode, insertListBox, insertListValues);

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
