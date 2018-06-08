import sanitizeHtml = require('sanitize-html');
export class HTMLParsing {

    static allowedTags: string[] = [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "a",
        "ul",
        "ol",
        "li",
        "b",
        "i",
        "strong",
        "em",
        "strike",
        "code",
        "hr",
        "br",
        "div",
        "span",
        "font",
        "sub",
        "sup",
        "table",
        "thead",
        "caption",
        "tbody",
        "tr",
        "th",
        "td",
        "pre"
      ];
    
      static allowedAttributes: any = {
        a: ["href", "target", , "shape"],
        font: ["color", "face", "size"],
        "*": ["style"]
      };
    
      static allowedStyles: any = {
        "*": {
          "direction": ["ltr", "rtl"],
          "margin-left": "*",
          "margin-right": "*",
          "text-align": ["left", "center", "right", "justify"],
          "background-color": " *"
        }};
    
    static clean(html:string):string {
        return sanitizeHtml(html, {allowedTags: HTMLParsing.allowedTags, allowedAttributes: HTMLParsing.allowedAttributes});
    }
    static castNodeToHTMLElement(node: Node): HTMLElement {
        if (node !== undefined && node.nodeType === 1) {
            return <HTMLElement>node;
        }
        return undefined;
    }

    static groupChildNodes(node: Node, elementsToGroup: string[], elementsToBreakAfter: string[] = ["br"],
        elementsToRemove: string[] = ["br"], keepTextOnly: boolean = false): Node[][] {
        let groups: Node[][] = [];
        let group: Node[] = [];
        let j: number = 0;
        $(node).contents().each((index, element) => {
            if (elementsToBreakAfter.indexOf(element.nodeName.toLowerCase()) !== -1) {
                if (elementsToRemove.indexOf(element.nodeName.toLowerCase()) === -1) {
                    group.push(element);
                }
                if (group.length > 0) {
                    groups.push(group);
                    group = [];
                }
            } else if (element.nodeType !== 3 && elementsToGroup.indexOf(element.nodeName.toLowerCase()) === -1) {
                if (group.length === 0) {
                    groups.push(group);
                    group = [];
                }
                if (elementsToRemove.indexOf(element.nodeName.toLowerCase()) === -1) {
                    if (keepTextOnly) {
                        $(element).contents().each((index, el) => {
                            if (el.nodeType === 1) {
                                HTMLParsing.groupChildNodes(el, elementsToGroup, elementsToBreakAfter,
                                    elementsToRemove, keepTextOnly).forEach(
                                        subgroup => {
                                            subgroup.forEach(el => group.push(el));
                                            if (group.length === 0) {
                                                groups.push(group);
                                                group = [];
                                            }
                                        }
                                    );
                            } else {
                                group.push(el);
                            }
                        });
                    } else {
                        group.push(element);
                    }
                }
                if (group.length === 0) {
                    groups.push(group);
                    group = [];
                }
            } else {
                if (elementsToRemove.indexOf(element.nodeName.toLowerCase()) === -1) {
                    group.push(element);
                }
            }
        });
        if (group.length > 0) {
            groups.push(group);
        }
        return groups;
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
        if (element === undefined || element.className === "rangySelectionBoundary") {
            return true;
        }
        if (nodeNames.length > 0 && nodeNames.indexOf(element.nodeName.toLowerCase()) === -1) {
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

    static removeDefaultCSS(node: Node): void {
        let element: HTMLElement = HTMLParsing.castNodeToHTMLElement(node);
        if (element === undefined) {
            return undefined;
        }
        element.style.marginBottom = HTMLParsing.removePropertyIfZero(element.style.marginBottom);
        element.style.marginLeft = HTMLParsing.removePropertyIfZero(element.style.marginLeft);
        element.style.marginRight = HTMLParsing.removePropertyIfZero(element.style.marginRight);
        element.style.marginTop = HTMLParsing.removePropertyIfZero(element.style.marginTop);
        element.style.paddingBottom = HTMLParsing.removePropertyIfZero(element.style.paddingBottom);
        element.style.paddingLeft = HTMLParsing.removePropertyIfZero(element.style.paddingLeft);
        element.style.paddingRight = HTMLParsing.removePropertyIfZero(element.style.paddingRight);
        element.style.paddingTop = HTMLParsing.removePropertyIfZero(element.style.paddingTop);
    }

    static removePropertyIfZero(value: string): string {
        if (parseInt(value, undefined) === 0) {
            return "";
        }
        return value;
    }

    static removePropertyIfDefaultValue(value: string, defaultValues:string[]): string {
        if (defaultValues.indexOf(value) !== -1) {
            return "";
        }
        return value;
    }
    static replaceCSS(node: Node): void {
        HTMLParsing.replaceCSSWithMarkUp(node, "fontWeight", { bold: $("<strong/>") });
        HTMLParsing.replaceCSSWithMarkUp(node, "fontStyle", { italic: $("<em/>") });
        HTMLParsing.replaceCSSWithMarkUp(node, "textDecoration", { underline: $("<u/>"), "line-through": $("<strike/>") });
        HTMLParsing.replaceCSSWithMarkUp(node, "verticalAlign", { sub: $("<sub/>"), super: $("<sup/>") });
        HTMLParsing.replaceCSSWithFont(node);
        HTMLParsing.cleanUpHTML(node);
    }

    static cleanUpHTML(node :Node):void {
        HTMLParsing.removeDefaultCSS(node);
        HTMLParsing.cleanUpTag(node, ["span"]);
        HTMLParsing.cleanUpTag(node, ["div"], undefined, true);
        HTMLParsing.cleanUpTag(node, ["font"], ["style", "face", "size", "color"]);
    }


    static replaceCSSWithFont(node: Node): void {
        let element: HTMLElement = HTMLParsing.castNodeToHTMLElement(node);
        if (element === undefined) {
            return;
        }
        let styleFont: string = HTMLParsing.getAndResetStyle(element, "font-family");
        let styleSize: string = HTMLParsing.getAndResetStyle(element, "font-size");
        let styleColor: string = HTMLParsing.getAndResetStyle(element, "color");
        let styleBackColor: string = HTMLParsing.getAndResetStyle(element, "background-color");
        if (styleFont === "" && styleSize === "" && styleColor === "" && styleBackColor === "") {
            return;
        }
        let newElement: HTMLElement = $("<font/>")[0];
        if (element.nodeName.toLowerCase() === "span") {
            newElement.setAttribute("style", element.getAttribute("style"));
        }
        if (styleFont !== "") {
            newElement.setAttribute("face", styleFont);
        }
        if (styleSize !== "") {
            newElement.setAttribute("size", styleSize);
        }
        if (styleColor !== "") {
            newElement.setAttribute("color", styleColor);
        }
        if (styleBackColor !== "") {
            newElement.style.backgroundColor = styleBackColor;
        }
        $(element).contents().wrapAll(newElement);
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
