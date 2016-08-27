/**
 * Created by shaomingquan on 16/7/8.
 */
;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            global.ColorPicker = factory()
})(this, function () {

    //获得dom节点到文档左上角距离
    function getOffsetRecurrence(dom) {
        function _(dom) {

            if (dom === document.body) {
                return [-dom.scrollLeft, -dom.scrollTop]
            }

            var nextOffsets = _(dom.parentNode);
            if (getComputedStyle(dom).position === 'static') {
                return [nextOffsets[0] - dom.scrollLeft, nextOffsets[1] - dom.scrollTop];
            } else {
                return [nextOffsets[0] + dom.offsetLeft - dom.scrollLeft, nextOffsets[1] + dom.offsetTop - dom.scrollTop];
            }
        }

        return _(dom)
    }

    //像素点转换成颜色字符串
    function pixelArrToColorString(c) {
        var alpha = Math.round(c[3] / 2.55) / 100;
        if (alpha === 1) {
            return ['rgb(' + c[0], c[1], c[2] + ')'].join(',');
        } else {
            return ['rgba(' + c[0], c[1], c[2], alpha + ')'].join(',');
        }
    }

    //十六进制转换成rgb
    function hexToRgb(color) {
        var sColor = color.toLowerCase();
        if (sColor.length === 4) {
            var sColorNew = "#";
            for (var i = 1; i < 4; i += 1) {
                sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
            }
            sColor = sColorNew;
        }
        var sColorChange = [];
        for (var i = 1; i < 7; i += 2) {
            sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
        }
        sColorChange.push(1)
        return sColorChange;

    };

    //样式字符串转换成rgba颜色数组
    function rgbaStringToArr(str) {
        var hexReg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
        if (hexReg.test(str)) {
            return hexToRgb(str);
        } else {
            var start = 4;
            if (str.indexOf('rgba') > -1) {
                start = 5;
            }
            var end = str.lastIndexOf(')');
            var arr = str.substring(start, end).split(',');
            //如果输入正确, 数组长度至少为3
            if (arr.length >= 3) {
                arr[3] = arr[3] || 1;
                return arr;
            }
        }
        //输入不正确或者为空
        return [255, 0, 0, 1];
    }

    //
    function getRgba(color) {
        return 'rgba(' + color.join(',') + ')';
    }

    function getPixel(x, y, picker) {
        var limitX, limitY;
        if (picker.name === 'colorPicker') {
            limitX = 25;
            limitY = 160;
        } else if (picker.name === 'detailPicker') {
            limitX = 160;
            limitY = 160;
        } else {
            limitX = 160;
            limitY = 25;
        }
        x = parseInt(x);
        y = parseInt(y);
        if (x >= limitX) {
            x = limitX - 1
        }
        if (y >= limitY) {
            y = limitY - 1
        }
        //canvas选色方案的缺陷, 有时候想选择纯黑的时候, 只能选到1,1,1
        var data = picker.canvas.getContext("2d").getImageData(x, y, 1, 1).data;
        if (data[0] === 1 && data[1] === 1 && data[2] === 1) {
            data[0] = data[1] = data[2] = 0;
        }
        return data;
    }

    function floatToPercentage(f) {
        return f * 100 + '%';
    }

    function rgb2hsv() {
        var rr, gg, bb,
            r = arguments[0] / 255,
            g = arguments[1] / 255,
            b = arguments[2] / 255,
            h, s,
            v = Math.max(r, g, b),
            diff = v - Math.min(r, g, b),
            diffc = function (c) {
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
            } else if (g === v) {
                h = (1 / 3) + rr - bb;
            } else if (b === v) {
                h = (2 / 3) + gg - rr;
            }
            if (h < 0) {
                h += 1;
            } else if (h > 1) {
                h -= 1;
            }
        }
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            v: Math.round(v * 100)
        };
    }

    function rgbToHsl(){
        var r = arguments[0] / 255,
            g = arguments[1] / 255,
            b = arguments[2] / 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min){
            h = s = 0; // achromatic
        }else{
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    function limit(xy) {
        if (xy < 0) {
            return 0;
        } else {
            return xy > 160 ? 160 : xy;
        }
    }

    //水平方向,垂直方向或者二维
    function ActivatePickerCursors(v, h, picker) {
        //是否二维
        var isRound = v && h;
        var stage = picker.dom;
        var cursor = picker.cursor;
        var canvas = picker.canvas;

        //根据不同的方向,定制不同的指针样式。
        decorateCursor();
        var cursorWidth = cursor.offsetWidth;
        var cursorHeight = cursor.offsetHeight;

        //获取全局的offset
        var offset = null;
        var masker = new AlphaMasker(picker.cursor.style.cursor);

        var mousemoveHandler = function (e) {
            if (e.target !== cursor) {
                var x = limit(e.clientX - offsets[0]);
                var y = limit(e.clientY - offsets[1]);
                if (isRound) {
                    cursor.style.top = y + 'px';
                    cursor.style.left = x + 'px';
                } else {
                    if (v) {
                        cursor.style.top = y + 'px';
                    } else if (h) {
                        cursor.style.left = x + 'px';
                    }
                }
                picker.positionChange(x, y);
            }
            e.preventDefault();
            return false;
        }

        var mousedownHandler = function (e) {
            if (e.target === canvas || e.target === picker.innerCursor) {
                offsets = getOffsetRecurrence(picker.dom);
                document.addEventListener('mousemove', mousemoveHandler);
                masker.show();
                mousemoveHandler(e);
            }
        }

        var mouseupHandler = function (e) {
            if (e.target === masker.dom) {
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
            if (isRound) {
                newStyle = 'position:absolute;'
                innerCursor.style = innerCursorCommonStyle + 'width:10px;height:10px;left:-8.5px;top:-8.5px;';
            } else {
                if (v) {
                    var stageWidth = stage.offsetWidth;
                    innerCursor.style = innerCursorCommonStyle + 'width:29px;height:5px;left:-2px;top:-3px;';
                    newStyle = 'height:1px;width:' + stageWidth + 'px;position:absolute;left:-1px;'
                } else if (h) {
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


    function Dispatcher(parent) {

        //create container
        var container = document.createElement('div');
        container.setAttribute('style', 'width:215px;height:215px;position:relative;background-color:rgba(250,250,255);border:1px solid #ddd;border-radius:6px;visibility:hidden;background-color:white;z-index:1000;');
        this.container = container;

        parent.appendChild(this.container);
    }

    Dispatcher.prototype.layout = function (ccp, cdp, cap) {
        this.ccp = ccp;
        this.cdp = cdp;
        this.cap = cap;
        var _this = this;
        Array.prototype.forEach.call(arguments, function (picker) {
            _this.container.appendChild(picker.dom);
        });
    }

    Dispatcher.prototype.dispatch = function (ccp, cdp, cap, callback) {
        //ccp => cdp => cap
        function getCapPx() {
            var x = cap.cursor.offsetLeft;
            callback(getPixel(!x ? 1 : x, 0, cap));
        }

        cap.onPositionChange = function (x, y) {
            var px = getPixel(x, y, this);
            callback(px, true);
        }

        var dx, dy;
        cdp.onPositionChange = function (x, y) {
            dx = x;
            dy = y;
            var px = getPixel(x, y, this);
            cap.fillCanvas(px);
            getCapPx();
        }

        ccp.onPositionChange = function (x, y) {
            var px = getPixel(x, y, this);
            cdp.fillCanvas(px);
            cdp.onPositionChange(dx, dy);
        }
    }

    function CancelBtn() {
        this.dom = document.createElement('div');
        this.dom.style = 'position:absolute;right:10px;bottom:10px;font-size:14px;height:25px;width:25px;border-radius:4px;border:1px solid #ccc;background-repeat:no-repeat;background-position:4px 4.5px;cursor:pointer;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA+UlEQVQ4T6XTMSuFYRjG8d9hs1gskiQWfAAlWRTlLOQzKGfkMxgwILN8CAajgZIshwElrFik2HXXo15v73teznnG5+n63/d1dT01HZ5aG/pBvOMztGWACcxgKA14xCVusIZTNMsAyxjAFULYjREE9AP9rQAh7sVhztpogi4k2EbRBjFhFvsFuUxhLN334Ri3eQuNRL34T7DZEDexg7c/AOZxjq8sYAu7eKkA9KRBq3kLcXGNKguRVR3becA45rBXscE6TnBX1INFRMoHJZAVvOLo572oiUupgVGkJ3RhGJN4yIpbVTnsTCdQDHnGGe7zm7XzmX4xOgZ8AzcfKxHa9LBsAAAAAElFTkSuQmCC)'
    }

    function ColorPicker() {
        this.dom = document.createElement('div');
        this.canvas = document.createElement('canvas');
        this.cursor = document.createElement('div');
        this.canvas.setAttribute('style', 'width:100%;height:100%;border-radius:6px;');
        this.dom.appendChild(this.canvas);
        this.dom.appendChild(this.cursor);

        this.fillCanvasCommon = function (callback) {
            var ctx = this.canvas.getContext("2d");
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.rect(0, 0, this.canvas.width, this.canvas.height);
            var canvasGradient = callback(ctx, this.canvas);
            ctx.fillStyle = canvasGradient;
            ctx.fill();
        }

        var _this = this;
        this.positionChange = function () {
            _this.onPositionChange.apply(this, arguments);
        }
    }

    function ColorColorPicker() {
        ColorPicker.call(this);
        this.name = 'colorPicker';
        this.canvas.style.cursor = 'ns-resize';
        this.cursor.style.cursor = 'ns-resize';
        this.canvas.width = 25;
        this.canvas.height = 160;
        this.dom.setAttribute('style', 'width:25px;height:160px;position:absolute;right:10px;top:10px;overflow:visible;border:1px solid #ddd;border-radius:6px;');
        // 160 * 160
    }

    ColorColorPicker.prototype.fillCanvas = function () {
        //static
        this.fillCanvasCommon(function (ctx, canvas) {
            var canvasGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            canvasGradient.addColorStop(0, "#f00");
            canvasGradient.addColorStop(0.17, "#ff0");
            canvasGradient.addColorStop(0.33, "#0f0");
            canvasGradient.addColorStop(0.50, "#0ff");
            canvasGradient.addColorStop(0.67, "#00f");
            canvasGradient.addColorStop(0.83, "#f0f");
            canvasGradient.addColorStop(1, "#f00");
            return canvasGradient;
        })
    }

    ColorColorPicker.prototype.initPosition = function (hsv) {
        var h = hsv.h;
        this.cursor.style.top = floatToPercentage(h / 360);
    }

    function ColorDetailPicker() {
        ColorPicker.call(this);
        this.name = 'detailPicker';
        this.canvas.style.cursor = 'crosshair';
        this.cursor.style.cursor = 'crosshair';
        this.canvas.width = 160;
        this.canvas.height = 160;
        this.dom.setAttribute('style', 'width:160px;height:160px;position:absolute;left:10px;top:10px;overflow:visible;border:1px solid #ddd;border-radius:6px;');
        // 25 * 160
    }

    ColorDetailPicker.prototype.fillCanvas = function (color) {
        this.fillCanvasCommon(function (ctx, canvas) {
            //base color
            var rgba = getRgba(color);
            ctx.fillStyle = rgba;
            ctx.fill();

            //white to alpha 0 ,horizen
            ctx.rect(0, 0, canvas.width, canvas.height);
            var grd0 = ctx.createLinearGradient(0, 0, canvas.width, 0);
            grd0.addColorStop(0, 'hsl(0, 0%, 50%)');
            grd0.addColorStop(1, 'hsla(0, 0%, 50%, 0)');
            ctx.fillStyle = grd0;
            ctx.fill();

            //black to alpha 0 ,vertical
            var grd1 = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grd1.addColorStop(0, 'hsl(0, 0%, 100%)');
            grd1.addColorStop(0.5, 'hsla(0, 0%, 100%, 0)');
            grd1.addColorStop(0.5, 'hsla(0, 0%, 0%, 0)');
            grd1.addColorStop(1, 'hsl(0, 0%, 0%)');
            return grd1;
        })
    }

    ColorDetailPicker.prototype.initPosition = function (hsv) {
        var s = hsv.s;
        var l = hsv.l;
        this.cursor.style.bottom = floatToPercentage(l / 100);
        this.cursor.style.left = floatToPercentage(s / 100);
        this.onPositionChange(s /  100* 160, (100 - l) / 100 * 160);
    }

    function ColorAlphaPicker() {
        ColorPicker.call(this);
        this.name = 'alphaPicker';
        this.canvas.style.cursor = 'ew-resize';
        this.cursor.style.cursor = 'ew-resize';
        this.canvas.width = 160;
        this.canvas.height = 25;
        this.dom.setAttribute('style', 'width:160px;height:25px;position:absolute;left:10px;bottom:10px;overflow:visible;border:1px solid #ddd;border-radius:6px;background-repeat:repeat;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACZJREFUeNpi/P//PwMSuHfvHjKXiQEvoKk0C5pblJSUBovTAAIMAGasCK35LxQ0AAAAAElFTkSuQmCC)');
        // 25 * 160
    }

    ColorAlphaPicker.prototype.fillCanvas = function (color) {
        this.fillCanvasCommon(function (ctx, canvas) {
            var grd = ctx.createLinearGradient(0, 0, canvas.width, 0);
            color[3] = 0;
            grd.addColorStop(0, getRgba(color));
            color[3] = 1;
            grd.addColorStop(1, getRgba(color));
            return grd;
        })
    }

    ColorAlphaPicker.prototype.initPosition = function (rgba) {
        var a = rgba[3];
        this.cursor.style.left = floatToPercentage(a / 1);
    }


    function AlphaMasker(cursor) {
        this.dom = document.createElement('div');
        this.dom.style = 'position:fixed;left:0;top:0;z-index:10000;width:100%;height:100%;cursor:' + cursor + ';';
    }

    AlphaMasker.prototype.show = function () {
        document.body.appendChild(this.dom);
    }

    AlphaMasker.prototype.hide = function () {
        document.body.removeChild(this.dom);
    }


    function CPicker(parent, color, callback) {
            //调度事件传递
            var dispatcher = new Dispatcher(parent);
            //基色选择
            var ccp = new ColorColorPicker();
            //详细选择
            var cdp = new ColorDetailPicker();
            //opacity选择
            var cap = new ColorAlphaPicker();
            //取消按钮
            var cancelBtn = new CancelBtn();
            //---------------------------
            this.ccp = ccp;
            this.cdp = cdp;
            this.cap = cap;
            this.cancelBtn = cancelBtn;
            this.callback = callback;
            //---------------------------
            dispatcher.layout(ccp, cdp, cap, cancelBtn);
            this.dispatcher = dispatcher;

            //init cursor events
            ActivatePickerCursors(true, false, ccp);
            ActivatePickerCursors(true, true, cdp);
            ActivatePickerCursors(false, true, cap);

            this.initColor(color);

    }

    CPicker.prototype.initColor = function (color, callback) {
        //填充canvas
        var rgbaArr = rgbaStringToArr(color);
        this.ccp.fillCanvas();
        this.cdp.fillCanvas(rgbaArr);
        this.cap.fillCanvas(rgbaArr);

        //调度pickers
        var firstTime = true;
        this.previousColor = rgbaArr;
        this.currentColor = rgbaArr;
        function dispatcherHandler(c, isCap) {
            if (c[3] === 3) {
                c[3] = 0;
            }
            if (isCap) {
                this.currentColor[3] = c[3];
            } else {
                this.currentColor = c;
            }
            if (firstTime) {
                this.callback(color);
                firstTime = false;
            } else {
                this.callback(pixelArrToColorString(this.currentColor));
            }
        }

        this.dispatcher.dispatch(this.ccp, this.cdp, this.cap, dispatcherHandler.bind(this));

        var _this = this;

        function initPosition() {
            //init position
            rgbaArr = rgbaStringToArr(color);
            var hslArr = rgbToHsl.apply(null, rgbaArr);
            console.log(hslArr);
            _this.ccp.initPosition(hslArr);
            _this.cdp.initPosition(hslArr);
            _this.cap.initPosition(rgbaArr);
        }

        this.cancelBtn.dom.onclick = function () {
            if (this.previousColor[3] === 1)
                this.previousColor[3] = 255;
            dispatcherHandler.bind(this)(this.previousColor);
        }.bind(this);
        initPosition();
    }

    CPicker.prototype.clickManager = function () {
        var container = this.dispatcher.container;
        var handler = function (e) {
            if (e.path.indexOf(container) < 0 || e.path.indexOf(this.cancelBtn.dom) > -1) {
                if (this.opened) {
                    this.close();
                }
                document.removeEventListener('click', handler);
            }
        }.bind(this);
        document.addEventListener('click', handler)
    }

    CPicker.prototype.open = function () {
        if (!this.opened) {
            this.dispatcher.container.style.visibility = 'visible';
            var _this = this;
            setTimeout(function () {
                _this.clickManager.call(_this);
            });
        }
        this.opened = true;
    }

    CPicker.prototype.close = function () {
        //这里更新previousColor
        if (this.opened) {
            this.dispatcher.container.style.visibility = 'hidden';
            this.previousColor = this.currentColor;
            console.log(this, this.previousColor);
        }
        this.opened = false;
    }

    return CPicker;
})
