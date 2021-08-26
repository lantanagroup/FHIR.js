"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlHelper = void 0;
class XmlHelper {
    static escapeInvalidCharacters(element) {
        if (!element)
            return element;
        Object.keys(element.attributes || {}).forEach(key => {
            element.attributes[key] = element.attributes[key]
                .replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;');
        });
        if (element.type === 'text' && element.text) {
            element.text = element.text
                .replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;');
        }
        (element.elements || []).forEach(element => XmlHelper.escapeInvalidCharacters(element));
        return element;
    }
    static unescapeInvalidCharacters(element) {
        if (!element)
            return element;
        Object.keys(element.attributes || {}).forEach(key => {
            element.attributes[key] = element.attributes[key]
                .replace(/&amp;/g, '&');
        });
        if (element.type === 'text' && element.text) {
            element.text = element.text
                .replace(/&amp;/g, '&');
        }
        (element.elements || []).forEach(element => XmlHelper.unescapeInvalidCharacters(element));
        return element;
    }
}
exports.XmlHelper = XmlHelper;
//# sourceMappingURL=xmlHelper.js.map