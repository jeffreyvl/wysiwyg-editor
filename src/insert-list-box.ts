import { EditArea } from "./edit-area";

export class InsertListBox {

    editArea:EditArea;
    select: HTMLElement;
    constructor(container:HTMLElement,editArea:EditArea, values:string[]) {
        this.editArea = editArea;
        this.select =  $("<select/>").addClass("insertlistselect").appendTo(container).attr("size",values.length)[0];
        this.renderOptions(values);
        $(this.select).dblclick(e => this.doubleClick(e,this));
    }

    renderOptions(values:string[]):void {
        values.forEach((value) => {
           let option: HTMLElement =  $("<option/>").addClass("inserlistoption").val(value).text(value).appendTo(this.select)[0];
        });
    }
    insertText(value:string):void {
        this.editArea.insertText(value);
    }

    doubleClick(e:JQuery.Event<HTMLElement,null>, that:InsertListBox):void {
        let element :HTMLElement = $(that.select).find("option:selected")[0];
        that.insertText(<string>($(element).val()));
    }
}