import { ActiveMode, Direction, CaretPosition, NodesInRange } from "./util";
import rangy from "rangy/lib/rangy-core.js";
import "rangy/lib/rangy-highlighter";
import "rangy/lib/rangy-classapplier";
import "rangy/lib/rangy-textrange";
import "rangy/lib/rangy-serializer";
import "rangy/lib/rangy-selectionsaverestore";
import { Helper } from "./helper";

export class EditArea {

    savedSelection: RangySelection;
    savedSelectionActiveElement: Element;
    previousRange: Range;
    textArea: HTMLTextAreaElement;
    editor: HTMLDivElement;
    pasteFlag: boolean = false;
    cutFlag: boolean = false;

    constructor(textArea: HTMLElement, editor: HTMLElement) {
        if (textArea.nodeName !== "TEXTAREA" || editor.nodeName !== "DIV") {
            throw Error("Invalid HTMLElements");
        }
        this.textArea = <HTMLTextAreaElement>textArea;
        this.editor = <HTMLDivElement>editor;
        editor.contentEditable = "true";
        rangy.init();
        this.updateEditor();
    }

    insertNodeAtRange(node: Node, caretPosition: CaretPosition = CaretPosition.After): void {
        let range: RangyRange = this.getFirstRange();
        if (!range) {
            return;
        }
        range.deleteContents();
        range.insertNode(node);
        switch (caretPosition) {
            case (CaretPosition.Before):
                this.setCaretBefore(node);
                break;
            case (CaretPosition.After):
                this.setCaretAfter(node);
                break;
        }
    }

    setCaretAfter(node: Node): void {
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        range.collapseAfter(node);
        rangy.getSelection().setSingleRange(range);
    }

    setCaretBefore(node: Node): void {
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        range.collapseBefore(node);
        rangy.getSelection().setSingleRange(range);
    }

    updateEditor(): void {
        $(this.editor).html($(this.textArea).val().toString());
        this.CleanUpCSS();
    }

    updateTextArea(): void {
        $(this.textArea).val(Helper.FormatHtmlString($(this.editor).html()));
    }

    updateMode(mode: ActiveMode): boolean {
        if (mode === ActiveMode.Html) {
            this.updateTextArea();
            $(this.editor).hide();
            $(this.textArea).show().focus();
        } else {
            this.updateEditor();
            $(this.textArea).hide();
            $(this.editor).show().focus();
        }
        if (mode === ActiveMode.Preview) {
            this.editor.contentEditable = "false";
        } else {
            this.editor.contentEditable = "true";
        }
        return true;
    }

    checkState(cmd: string): boolean {
        this.editor.focus();
        if (document.queryCommandEnabled(cmd)) {
            return document.queryCommandState(cmd);
        }
    }

    getValueOfClosestContainerWithPropertyFromRange(property: string): string {
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return "";
        }
        let container: HTMLElement = this.getParentContainerOfRangeWithType([], range);
        if (container !== undefined && container.style && container.style[property] !== "" && container.style[property] !== undefined) {
            return container.style[property];
        }
        return this.getValueOfClosestContainerWithPropertyFromNode(property, container);
    }

    getValueOfClosestContainerWithPropertyFromNode(property: string, node: Node): string {
        let value: string = "";
        $(node).parentsUntil(this.editor).each((index, element) => {
            if (element.style && element.style[property] !== undefined && element.style[property] !== "") {
                value = element.style[property];
                return false;
            }
        });
        return value;
    }

    getDirection(): Direction {
        let direction: string = this.getValueOfClosestContainerWithPropertyFromRange("direction");
        return direction === "" || direction.toLowerCase() === "ltr" ? Direction.LTR : Direction.RTL;
    }

    changeDirection(direction: Direction): boolean {
        this.editor.focus();
        this.saveSelection();
        if (direction === Direction.RTL) {
            let element: HTMLElement = this.castNodeToHTMLElement(this.editor.firstChild);
            if (element !== undefined && this.editor.childNodes.length === 1
                && element.nodeName.toLowerCase() === "div") {
                $(element).css("direction", "rtl");
            } else {
                let par: HTMLElement = $("<div/>").css("direction", "rtl")[0];
                $(this.editor).contents().wrapAll(par);
            }
            this.removeCSSPropertyChildren(this.editor.firstChild, "direction");
        } else {
            let firstChild: HTMLElement = this.castNodeToHTMLElement(this.editor.firstChild);
            this.removeCSSPropertyChildren(this.editor, "direction");
            if (firstChild !== undefined && this.editor.childNodes.length === 1) {
                this.cleanUpTag(firstChild, ["div"]);
            }
        }
        this.editor.focus();
        this.restoreSelection();
        return true;
    }

    removeCSSPropertyChildren(node: Node, property: string): void {
        $(node).children().each((index, elem) => {
            elem.style[property] = "";
            this.cleanUpTag(elem, ["span", "div"]);
            this.removeCSSPropertyChildren(elem, property);
        });
    }
    saveSelection(): void {
        if (this.savedSelection) {
            rangy.removeMarkers(this.savedSelection);
        }
        this.savedSelection = rangy.saveSelection();
        this.savedSelectionActiveElement = document.activeElement;
    }
    restoreSelection(): void {
        if (this.savedSelection) {
            rangy.restoreSelection(this.savedSelection, true);
            this.savedSelection = null;
            window.setTimeout(() => {
                if (this.savedSelectionActiveElement && typeof (<HTMLElement>this.savedSelectionActiveElement).focus !== "undefined") {
                    (<HTMLElement>this.savedSelectionActiveElement).focus();
                }
            }, 1);
        }
    }

    getFirstRange(): RangyRange {
        this.editor.focus();
        let sel: RangySelection = rangy.getSelection();
        return sel.rangeCount ? sel.getRangeAt(0) : undefined;
    }

    formatDoc(cmd: string, showUI?: boolean, value?: any): void {
        this.editor.focus();
        if (document.queryCommandEnabled(cmd)) {
            document.execCommand(cmd, showUI, value);
            this.updateTextArea();
        }
        this.editor.focus();
    }

    insertParagraph(): void {
        if (this.checkIfRangeIsInsideContainerWithType(["p"])) {
            return;
        }
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        // this.saveSelection();
        let newPar: HTMLElement = document.createElement("p");

        if (range.collapsed) {
            let container: Node = this.getParentContainerOfRangeWithType([], range, ["strong", "em", "sub", "sup", "u", "strike"]);
            container = container === undefined ? this.editor : container;
            this.surroundContainerWithElement(container, newPar);
        } else {

            let children: Node[] = this.getNodesInRange(range, NodesInRange.ChildrenAll, [1, 3]);

            if (this.getNodesInRange(range, NodesInRange.Intersecting, [1]) === [] && children.length === 1) {
                this.surroundContainerWithElement(children[0], newPar);
            } else {
                $(children).wrapAll(newPar);
            }

        }  // this.restoreSelection();
        this.removeTagKeepAttributesChildren(newPar);
    }

    getHighestNodeFromRange(range?: RangyRange): Node | undefined {
        if (range === undefined) {
            range = this.getFirstRange();
        }
        if (range === undefined) {
            return undefined;
        }
        let node: Node = range.commonAncestorContainer;
        while (node.parentNode !== this.editor) {
            node = node.parentNode;
        }
        return node;
    }
    surroundContainerWithElement(container: Node, element: HTMLElement): Node {
        if (container === this.editor) {
            return $(this.editor).contents().wrapAll(element)[0];
        } else if (["span", "div"].indexOf(container.nodeName.toLowerCase()) !== -1) {

            return this.replaceTag(<HTMLElement>container, element);

        } else {
            return $(container).wrap(element)[0];
        }
    }

    getNodesInRange(range?: RangyRange, position: NodesInRange = NodesInRange.All, nodeTypes: number[] = [1]): Node[] {
        let nodes: Node[] = [];
        if (range === undefined) {
            range = this.getFirstRange();
            if (range === undefined) {
                return nodes;
            }
        }
        let container: Node = range.commonAncestorContainer;
        let sorting: (node: Node) => boolean = undefined;
        if (position === NodesInRange.Intersecting) {
            sorting = (node) => { return !range.containsNodeContents(node); };
        }
        if (position === NodesInRange.Inside) {
            sorting = (node) => { return range.containsNodeContents(node); };
        }
        if (position === NodesInRange.ChildrenAll) {
            sorting = (node) => { return node.parentNode === container; };
        }
        if (position === NodesInRange.Inside) {
            sorting = (node) => { return node.parentNode === container && range.containsNodeContents(node); };
        }
        nodes = range.getNodes(nodeTypes, sorting);
        return nodes;
    }
    checkIfRangeContainsContainerWithType(nodeNames: string[] = []): boolean {
        return this.checkIfRangeIsExactelyContainerWithType(nodeNames) || this.checkIfRangeIsInsideContainerWithType(nodeNames);
    }
    checkIfRangeIsExactelyContainerWithType(nodeNames: string[] = [], range?: RangyRange): boolean {
        return this.getContainerExactelyInRangeWithType !== undefined;
    }

    getContainerExactelyInRangeWithType(nodeNames: string[] = [], range?: RangyRange): Node | undefined {
        let node: Node = undefined;
        if (range === undefined) {
            range = this.getFirstRange();
        }
        if (range === undefined) {
            return node;
        }
        let children: Node[] = this.getNodesInRange(range, NodesInRange.ChildrenAll, [1, 3]);

        if (this.getNodesInRange(range, NodesInRange.Intersecting, [1]) === [] && children.length === 1 &&
            (nodeNames === [] || nodeNames.indexOf(children[0].nodeName) !== -1)) {
            node = children[0];
        }
        return node;
    }

    checkIfRangeIsInsideContainerWithType(nodeNames: string[] = [], range?: RangyRange, blackList: string[] = []): boolean {
        return this.getParentContainerOfRangeWithType(nodeNames, range, blackList) !== undefined;
    }

    checkIfNodeIsInsideContainerWithType(container: Node, nodeNames: string[] = [], blackList: string[] = []): boolean {
        return this.getParentContainerOfNodeWithType(container, nodeNames, blackList) !== undefined;
    }

    getParentContainerOfRangeWithType(nodeNames: string[] = [], range?: RangyRange, blackList: string[] = []): HTMLElement | undefined {
        if (range === undefined) {
            range = this.getFirstRange();
        }
        if (range === undefined) {
            return undefined;
        }
        let container: Node = range.commonAncestorContainer;
        if (container.nodeType === 1 && (nodeNames === [] || nodeNames.indexOf(container.nodeName.toLowerCase()) !== -1) &&
            (blackList.indexOf(container.nodeName.toLowerCase()) === -1)) {
            return <HTMLElement>container;
        }
        return this.getParentContainerOfNodeWithType(container, nodeNames, blackList);
    }

    getParentContainerOfNodeWithType(container: Node, nodeNames: string[] = [], blackList: string[] = []): HTMLElement | undefined {
        let node: HTMLElement = undefined;
        $(container).parentsUntil(this.editor).each((index: number, element: HTMLElement): false => {
            if (element.nodeType === 1 && (nodeNames === [] || nodeNames.indexOf(element.nodeName.toLowerCase()) !== -1) &&
                (blackList.indexOf(container.nodeName.toLowerCase()) === -1)) {
                node = element;
                return false;
            }
        });
        return node;
    }

    CleanUpCSS(): void {
        $(this.editor).find("*").each((index, element) => {
            this.RemoveCSS(element);
        });
    }
    RemoveCSS(element: HTMLElement): void {
        this.replaceCSSWithMarkUp(element);
        this.replaceCSSWithAttribute(element);
        // this.cleanUpTag(element, ["span", "div"]);
    }

    replaceCSSWithMarkUp(element: HTMLElement): void {
        this.replaceCSSWithMarkUpNode(element, "fontWeight", { bold: $("<strong/>") });
        this.replaceCSSWithMarkUpNode(element, "fontStyle", { italic: $("<em/>") });
        this.replaceCSSWithMarkUpNode(element, "textDecoration", { underline: $("<u/>"), "line-through": $("<strike/>") });
        this.replaceCSSWithMarkUpNode(element, "verticalAlign", { sub: $("<sub/>"), super: $("<sup/>") });
    }

    replaceCSSWithAttribute(element: HTMLElement): void {
        this.replaceCSSWithAttributeNode(element, "text-align", "align",
            { left: "left", center: "center", right: "right", justify: "justify" });
    }

    replaceCSSWithAttributeNode(element: HTMLElement, property: string, attribute: string, transform: {}): void {
        let style: string = this.getAndResetStyle(element, property);
        if (style === "") {
            return;
        }
        for (let key of Object.keys(transform)) {
            if (style.indexOf(key) !== -1) {
                element[attribute] = transform[key];
            }
        }
    }
    replaceCSSWithMarkUpNode(element: HTMLElement, property: string, transform: {}): void {
        let style: string = this.getAndResetStyle(element, property);
        if (style === "") {
            return;
        }
        for (let key of Object.keys(transform)) {
            if (style.indexOf(key) !== -1) {
                $(element).contents().wrapAll(transform[key]);
            }
        }
    }

    getAndResetStyle(element: HTMLElement, property: string): string {
        let style: string = element.style[property];

        if (style === "" || style === undefined) {
            return "";
        }
        element.style[property] = "";
        return style;
    }

    cleanUpTag(element: HTMLElement, nodeNames: string[] = [], attributes: string[] = ["style", "align"]): boolean {
        if (element === undefined ||
            (nodeNames !== [] && nodeNames.indexOf(element.tagName.toLowerCase()) === -1)) {
            return true;
        }
        let unwrap: boolean = true;
        attributes.forEach((val) => {
            if (element.getAttribute(val) !== null &&
                element.getAttribute(val) !== "") {
                unwrap = false;
            }
        });
        if (unwrap) {
            $(element).contents().unwrap();
        }
        return unwrap;
    }

    removeTagKeepAttributes(element: HTMLElement, nodeNames: string[] = [], insertBR: boolean = false,
        attributes: string[] = ["style", "align"]): void {
        if (insertBR && (nodeNames === [] || nodeNames.indexOf(element.tagName.toLowerCase()) !== -1)) {
            $(element).insertAfter($("<br>"));
        }
        if (this.cleanUpTag(element, nodeNames, attributes)) {
            return;
        }
        let span: HTMLElement = $("<span/>")[0];
        this.replaceTag(element, span, attributes);
    }
    removeTagKeepAttributesRecursive(element: HTMLElement, nodeNames: string[] = [], insertBR: boolean = false,
        attributes: string[] = ["style", "align"]): void {
        this.removeTagKeepAttributes(element, nodeNames, insertBR, attributes);
        this.removeTagKeepAttributesChildren(element, nodeNames, insertBR, attributes);
    }
    removeTagKeepAttributesChildren(element: HTMLElement, nodeNames: string[] = [], insertBR: boolean = false,
        attributes: string[] = ["style", "align"]): void {
        $(element).children().each((index, element) => this.removeTagKeepAttributes(element, nodeNames, insertBR, attributes));
    }

    replaceTag(element: HTMLElement, newElement: HTMLElement, attributes: string[] = ["style", "align"]): HTMLElement {
        attributes.forEach((val) => {
            newElement.setAttribute(val, element.getAttribute(val));
        });
        return <HTMLElement>$(element).contents().unwrap().wrapAll(newElement)[0];
    }


    // removeCSSFromRange(range: RangyRange, property: string): void {
    //     let nodes: Node[] = range.getNodes([1], (node: Node) => { return range.containsNodeContents(node); });
    //     nodes.forEach((node) => this.removeCSSElement(<Element>node, property));
    // }
    // removeCSSElement(element: Element, property: string): void {
    //     $(element).css(property, "");
    // }

    castNodeToHTMLElement(node: Node): HTMLElement {
        if (node !== undefined && node.nodeType === 1) {
            return <HTMLElement>node;
        }
        return undefined;
    }

}

  // insertBreakAtRange(): void {
    //     let node: Node = $("<br>")[0];
    //     this.insertNodeAtRange(node);
    //     this.checkLastBreak(node);
    // }

    // checkLastBreak(node: Node): void {
    //     if (this.editor.lastChild === node) {
    //         let lastBreak: Node = $("<br>")[0];
    //         this.insertNodeAtRange(lastBreak, CaretPosition.Before);
    //     }
    // }



