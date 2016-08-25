var INITIALIZE = 'initialize';
var DRAW_MAP = 'draw';
var SHOW_DATA = 'show data';
var PREVIOUS = 'previous';
var NEXT = 'next';
var I1_CHART = 'i1 chart';

try {
    module.exports.INITIALIZE = INITIALIZE;
    module.exports.DRAW_MAP = DRAW_MAP;
    module.exports.SHOW_DATA = SHOW_DATA;
    module.exports.PREVIOUS = PREVIOUS;
    module.exports.NEXT = NEXT;
    module.exports.I1_CHART = I1_CHART;
    console.log('We are running on the server...');
} catch(err) {
    console.log('We are running on the browser...');
}
