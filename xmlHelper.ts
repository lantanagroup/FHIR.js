import * as _ from 'underscore';

export class XmlHelper {
    static escapeInvalidCharacters(element) {
        _.each(element.attributes, (attribute, index) => {
            element.attributes[index] = element.attributes[index]
                .replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;');
        });

        if (element.type === 'text' && element.text) {
            element.text = element.text
                .replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;');
        }

        _.each(element.elements, XmlHelper.escapeInvalidCharacters);

        return element;
    }

    static unescapeInvalidCharacters(element) {
        _.each(element.attributes, (attribute, index) => {
            element.attributes[index] = element.attributes[index]
                .replace(/&amp;/g, '&');
        });

        if (element.type === 'text' && element.text) {
            element.text = element.text
                .replace(/&amp;/g, '&');
        }

        _.each(element.elements, XmlHelper.unescapeInvalidCharacters);

        return element;
    }
}