var _ = require('underscore');

function escapeInvalidCharacters(element) {
    _.each(element.attributes, function(attribute, index) {
        element.attributes[index] = element.attributes[index]
            .replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;');
    });

    if (element.type === 'text' && element.text) {
        element.text = element.text
            .replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;');
    }

    _.each(element.elements, escapeInvalidCharacters);

    return element;
}

function unescapeInvalidCharacters(element) {
    _.each(element.attributes, function(attribute, index) {
        element.attributes[index] = element.attributes[index]
            .replace(/&amp;/g, '&');
    });

    if (element.type === 'text' && element.text) {
        element.text = element.text
            .replace(/&amp;/g, '&');
    }

    _.each(element.elements, unescapeInvalidCharacters);

    return element;
}

module.exports = {
    escapeInvalidCharacters: escapeInvalidCharacters,
    unescapeInvalidCharacters: unescapeInvalidCharacters
};