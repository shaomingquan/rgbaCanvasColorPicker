/**
 * Created by shaomingquan on 16/7/8.
 */

function getOffsetRecurrence (dom) {
    function _ (dom) {

        if(dom === document.body) {
            return [0, 0]
        }

        var nextOffsets = _ (dom.parentNode);
        if(getComputedStyle(dom).position === 'static') {
            return nextOffsets;
        } else {
            return [nextOffsets[0] + dom.offsetLeft, nextOffsets[1] + dom.offsetTop];
        }
    }

    return _(dom)
}

function rgbaStringToArr (str) {
    var start = 4;
    if(str.indexOf('rgba') > -1) {
        start = 5;
    }
    var end = str.lastIndexOf(')');
    var arr = str.substring(start, end).split(',');
    arr[3] = arr[3] || 1;
    return arr;
}

function getRgba (color) {
    return 'rgba(' + color.join(',') + ')';
}

function getPixel (x, y, picker) {
    var limitX, limitY;
    if(picker.name === 'colorPicker') {
        limitX = 25;
        limitY = 160;
    } else if(picker.name === 'detailPicker') {
        limitX = 160;
        limitY = 160;
    } else {
        limitX = 160;
        limitY = 25;
    }
    x = parseInt(x);
    y = parseInt(y);
    if(x >= limitX) {x = limitX - 1};
    if(y >= limitY) {y = limitY - 1};
    return picker.canvas.getContext("2d").getImageData(x,y,1,1).data;
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

function limit(xy) {
    if(xy < 0) {
        return 0;
    }else {
        return xy > 160 ? 160 : xy;
    }
}

function ActivatePickerCursors(v, h, picker) {
    var isRound = v && h;
    var stage = picker.dom;
    var cursor = picker.cursor;
    var canvas = picker.canvas;

    decorateCursor();
    var cursorWidth = cursor.offsetWidth;
    var cursorHeight = cursor.offsetHeight;

    var offsets = getOffsetRecurrence(picker.dom);
    var masker = new AlphaMasker(picker.cursor.style.cursor);

    var mousemoveHandler = function(e) {
        if(e.target !== cursor) {
            var x = limit(e.clientX - offsets[0]);
            var y = limit(e.clientY - offsets[1]);
            if(isRound) {
                cursor.style.top = y + 'px';
                cursor.style.left = x + 'px';
            } else {
                if(v) {
                    cursor.style.top = y + 'px';
                } else if(h) {
                    cursor.style.left = x + 'px';
                }
            }
            picker.positionChange(x, y);
        }
        e.preventDefault();
        return false;
    }

    var mousedownHandler = function (e) {
        if(e.target === canvas || e.target === picker.innerCursor) {
            document.addEventListener('mousemove', mousemoveHandler);
            masker.show();
            mousemoveHandler(e);
        }
    }

    var mouseupHandler = function (e) {
        if(e.target === masker.dom){
            masker.hide();
            document.removeEventListener('mousemove', mousemoveHandler)
        }
    }

    document.addEventListener('mousedown', mousedownHandler);
    document.addEventListener('mouseup', mouseupHandler);

    function decorateCursor() {
        var oldStyle = cursor.getAttribute('style') || '';
        var commonStyle = 'background-color:transpanrent;';
        var newStyle = '';
        var innerCursor = document.createElement('div');
        var innerCursorCommonStyle = 'position:absolute;border: 1px solid #999;border-radius:4px;background-color:rgba(180,180,180,0.5);'
        if(isRound) {
            newStyle = 'position:absolute;'
            innerCursor.style = innerCursorCommonStyle + 'width:10px;height:10px;left:-8.5px;top:-8.5px;';
        } else {
            if(v) {
                var stageWidth = stage.offsetWidth;
                innerCursor.style = innerCursorCommonStyle + 'width:29px;height:5px;left:-2px;top:-3px;';
                newStyle = 'height:1px;width:' + stageWidth + 'px;position:absolute;left:-1px;'
            } else if(h) {
                var stageHeight = stage.offsetHeight;
                innerCursor.style = innerCursorCommonStyle + 'width:5px;height:29px;left:-3px;top:-2px;';
                newStyle = 'height:' + stageHeight + 'px;width:1px;position:absolute;top:-1px;'
            } else {
                throw new Error('input error');
            }
        }

        var finalStyle = [oldStyle, commonStyle, newStyle].join(';');
        cursor.setAttribute('style', finalStyle);
        cursor.appendChild(innerCursor);
        picker.innerCursor = innerCursor;
    }

}
