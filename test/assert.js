var assert = require('assert');
var xpath = require('xpath');

var xpathSelect = xpath.useNamespaces({
    "fhir": "http://hl7.org/fhir",
    "atom": "http://www.w3.org/2005/Atom",
    "xhtml": "http://www.w3.org/1999/xhtml"
});

module.exports = require('assert');

module.exports.xpathEqual = function(node, xpathString, value) {
    var nodes = xpathSelect(xpathString, node);

    if (nodes.length == 0) {
        assert.fail('xpath did not return any nodes: ' + xpathString);
    }

    var node = nodes[0];

    if (!node || (!node.value && !node.data)) {
        assert.fail('xpath node does not have a value: ' + xpathString);
    }

    assert.equal(node.value ? node.value : node.data, value);
};

module.exports.xpathNodeName = function(node, xpathString, name) {
    var nodeName = xpathSelect('name(' + xpathString + ')', node);
    assert.equal(nodeName, name, 'xpath node name does not match: ' + xpathString);
};

module.exports.xpathCount = function(node, xpathString, count) {
    var actual = xpathSelect('count(' + xpathString + ')', node);
    assert.equal(actual, count, 'Did not find correct number of nodes: ' + xpathString);
};