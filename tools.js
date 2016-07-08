/**
 * Created by shaomingquan on 16/7/8.
 */

function rgbaStringToArr (str) {
    var start = 4;
    if(str.indexOf('rgba') > -1) {
        start = 5;
    }
    var end = str.lastIndexOf(')');
    return str.substring(start, end).split(',');
}

function getRgba (color) {
    return 'rgba(' + color.join(',') + ')';
}

function getPixel (x, y, canvas) {
    if(x === 160){x = 159};
    if(y === 160){y = 159};
    return canvas.getContext("2d").getImageData(x,y,1,1).data;
}

function floatToPercentage (f) {
    return f * 100 + '%';
}

function rgb2hsv () {
    var rr, gg, bb,
        r = arguments[0] / 255,
        g = arguments[1] / 255,
        b = arguments[2] / 255,
        h, s,
        v = Math.max(r, g, b),
        diff = v - Math.min(r, g, b),
        diffc = function(c){
            return (v - c) / 6 / diff + 1 / 2;
        };

    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
            h = bb - gg;
        }else if (g === v) {
            h = (1 / 3) + rr - bb;
        }else if (b === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100)
    };
}

function ActivatePickerCursors(v, h, picker) {
    var isRound = v && h;
    var stage = picker.dom;
    var cursor = picker.cursor;
    var canvas = picker.canvas;

    decorateCursor();
    var cursorWidth = cursor.offsetWidth;
    var cursorHeight = cursor.offsetHeight;

    var mousemoveHandler = function(e) {
        if(e.target === canvas) {
            var x = e.layerX;
            var y = e.layerY;
            if(isRound) {
                cursor.style.top = y - parseInt(cursorHeight / 2) + 'px';
                cursor.style.left = x - parseInt(cursorWidth / 2) + 'px';
                console.log(cursor.style.top, y, parseInt(cursorHeight / 2));
            } else {
                if(v) {
                    cursor.style.top = y - parseInt(cursorHeight / 2) + 'px';
                } else if(h) {
                    cursor.style.left = x - parseInt(cursorWidth / 2) + 'px';
                }
            }
            picker.positionChange(x, y);
        }
        e.preventDefault();
        return false;
    }

    var mousedownHandler = function (e) {
        stage.addEventListener('mousemove', mousemoveHandler);
        mousemoveHandler(e);
    }

    stage.addEventListener('mousedown', mousedownHandler);
    stage.addEventListener('mouseup', function () {
        stage.removeEventListener('mousemove', mousemoveHandler)
    });

    function decorateCursor() {
        var oldStyle = cursor.getAttribute('style') || '';
        var commonStyle = 'background: black;';
        var newStyle = '';
        if(isRound) {
            newStyle = 'height:4px;width:4px;position:absolute;'
        } else {
            if(v) {
                var stageWidth = stage.offsetWidth;
                console.log(stageWidth);
                newStyle = 'height:1px;width:' + stageWidth + 'px;position:absolute;left:0;'
            } else if(h) {
                var stageHeight = stage.offsetHeight;
                newStyle = 'height:' + stageHeight + 'px;width:1px;position:absolute;top:0;'
            } else {
                throw new Error('input error');
            }
        }

        var finalStyle = [oldStyle, commonStyle, newStyle].join(';');
        cursor.setAttribute('style', finalStyle);
    }
}
