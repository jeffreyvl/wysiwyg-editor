export class HTMLParsing {

    static castNodeToHTMLElement(node: Node): HTMLElement {
        if (node !== undefined && node.nodeType === 1) {
            return <HTMLElement>node;
        }
        return undefined;
    }

    static removePropertyRecursively(node: Node, property: string): void {
        this.removeProperty(node, property);
        this.removePropertyChildren(node, property);
    }

    static removePropertyChildren(node: Node, property: string): void {
        $(node).children().each((index, elem) => {
            HTMLParsing.removeProperty(elem, property);
            HTMLParsing.removePropertyChildren(elem, property);
        });
    }

    static removeProperty(node: Node, property: string): void {
        let element: HTMLElement = HTMLParsing.castNodeToHTMLElement(node);
        if (element === undefined) {
            return;
        }
        element.style[property] = "";
        HTMLParsing.cleanUpTag(element, ["div"], undefined, true);
        HTMLParsing.cleanUpTag(element, ["span"]);
    }

    static removeAttributeRecursively(node: Node, attribute: string): void {
        this.removeAttribute(node, attribute);
        this.removeAttributeChildren(node, attribute);
    }

    static removeAttributeChildren(node: Node, attribute: string): void {
        $(node).children().each((index, elem) => {
            HTMLParsing.removeAttribute(elem, attribute);
            HTMLParsing.removeAttributeChildren(elem, attribute);
        });
    }

    static removeAttribute(node: Node, attribute: string): void {
        let element: HTMLElement = HTMLParsing.castNodeToHTMLElement(node);
        if (element === undefined) {
            return;
        }
        element[attribute] = "";
        HTMLParsing.cleanUpTag(element, ["div"], undefined, true);
        HTMLParsing.cleanUpTag(element, ["span"]);
    }


    static removeTagKeepAttributesRecursive(node: Node, nodeNames: string[] = [], insertBR: boolean = false,
        attributes: string[] = ["style"]): void {
        HTMLParsing.removeTagKeepAttributes(node, nodeNames, insertBR, attributes);
        HTMLParsing.removeTagKeepAttributesChildren(node, nodeNames, insertBR, attributes);
    }
    static removeTagKeepAttributesRecursiveInsertBRChildren(node: Node, nodeNames: string[] = [],
        attributes: string[] = ["style"]): void {
        HTMLParsing.removeTagKeepAttributes(node, nodeNames, false, attributes);
        HTMLParsing.removeTagKeepAttributesChildren(node, nodeNames, true, attributes);
    }

    static removeTagKeepAttributesChildren(node: Node, nodeNames: string[] = [], insertBR: boolean = false,
        attributes: string[] = ["style"]): void {
        $(node).children().each((index, element) =>
            HTMLParsing.removeTagKeepAttributesRecursive(element, nodeNames, insertBR, attributes));
    }

    static removeTagKeepAttributes(node: Node, nodeNames: string[] = [], insertBR: boolean = false,
        attributes: string[] = ["style"]): void {
        let element: HTMLElement = HTMLParsing.castNodeToHTMLElement(node);
        if (element === undefined) {
            return;
        }
        if (nodeNames.length > 0 && nodeNames.indexOf(element.tagName.toLowerCase()) === -1) {
            return;
        }

        if (HTMLParsing.cleanUpTag(element, nodeNames, attributes, insertBR)) {
            return;
        }
        let span: HTMLElement = $("<span/>")[0];
        HTMLParsing.replaceTag(element, span, attributes);
    }

    static cleanUpTag(node: Node, nodeNames: string[] = [], attributes: string[] = ["style"],
        insertBR: boolean = false): boolean {
        let element: HTMLElement = HTMLParsing.castNodeToHTMLElement(node);
        if (element === undefined || element.className === "rangySelectionBoundary"
            || (nodeNames.length > 0 && nodeNames.indexOf(element.nodeName.toLowerCase()) === -1)) {
            return true;
        }
        if (insertBR) {
            $("<br>").insertAfter(element);
        }
        let unwrap: boolean = true;
        attributes.forEach((val) => {
            if (element.getAttribute(val) !== null &&
                element.getAttribute(val) !== "") {
                unwrap = false;
            }
        });
        if (unwrap) {
            if ($(element).contents().length > 0) {
                $(element).contents().unwrap();
            } else {
                $(element).remove();
            }
        }
        return unwrap;
    }

    static replaceTag(node: Node, newElement: HTMLElement, attributes: string[] = ["style"]): HTMLElement {
        let element: HTMLElement = HTMLParsing.castNodeToHTMLElement(node);
        if (element === undefined || element.className === "rangySelectionBoundary") {
            return undefined;
        }
        attributes.forEach((attr) => {
            let val: string = element.getAttribute(attr);
            if (val !== "" && val !== undefined) {
                newElement.setAttribute(attr, element.getAttribute(attr));
            }
        });
        if ($(element).contents().length > 0) {
            return <HTMLElement>$(element).contents().unwrap().wrapAll(newElement).parent()[0];
        } else {
            $(element).remove();
            return undefined;
        }
    }

    static replaceCSS(node: Node): void {
        HTMLParsing.replaceCSSWithMarkUp(node, "fontWeight", { bold: $("<strong/>") });
        HTMLParsing.replaceCSSWithMarkUp(node, "fontStyle", { italic: $("<em/>") });
        HTMLParsing.replaceCSSWithMarkUp(node, "textDecoration", { underline: $("<u/>"), "line-through": $("<strike/>") });
        HTMLParsing.replaceCSSWithMarkUp(node, "verticalAlign", { sub: $("<sub/>"), super: $("<sup/>") });
        HTMLParsing.cleanUpTag(node, ["span", "div"]);
    }

    static replaceCSSWithAttribute(node: Node, property: string, attribute: string, transform: {}): void {
        let element: HTMLElement = HTMLParsing.castNodeToHTMLElement(node);
        if (element === undefined) {
            return;
        }
        let style: string = HTMLParsing.getAndResetStyle(element, property);
        if (style === "") {
            return;
        }
        for (let key of Object.keys(transform)) {
            if (style.indexOf(key) !== -1) {
                element[attribute] = transform[key];
            }
        }
    }
    static replaceCSSWithMarkUp(node: Node, property: string, transform: {}): void {
        let element: HTMLElement = HTMLParsing.castNodeToHTMLElement(node);
        if (element === undefined) {
            return;
        }
        let style: string = HTMLParsing.getAndResetStyle(element, property);
        if (style === "") {
            return;
        }
        for (let key of Object.keys(transform)) {
            if (style.indexOf(key) !== -1) {
                $(element).contents().wrapAll(transform[key]);
            }
        }
    }

    static getAndResetStyle(node: Node, property: string): string {
        let element: HTMLElement = HTMLParsing.castNodeToHTMLElement(node);
        if (element === undefined) {
            return "";
        }
        let style: string = element.style[property];

        if (style === "" || style === undefined) {
            return "";
        }
        element.style[property] = "";
        return style;
    }
}
