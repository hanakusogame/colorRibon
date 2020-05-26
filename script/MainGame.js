"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//メインのゲーム画面
var MainGame = /** @class */ (function (_super) {
    __extends(MainGame, _super);
    function MainGame(scene) {
        var _this = this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(scene);
        _this = _super.call(this, { scene: scene, x: 0, y: 0, width: 640, height: 360 }) || this;
        var bg = new g.FilledRect({
            scene: scene,
            width: 640,
            height: 360,
            cssColor: "black",
            opacity: 0.5
        });
        _this.append(bg);
        //枠線
        var lines = [];
        var linePos = [5, 20 + (70 * 4) + 5];
        for (var i = 0; i < 2; i++) {
            var line = new g.FilledRect({
                scene: scene,
                x: 0,
                y: linePos[i],
                width: 640,
                height: 10,
                cssColor: "white",
                opacity: 0.8
            });
            lines.push(line);
            _this.append(line);
        }
        var base = new g.E({
            scene: scene,
            y: 20,
            width: 640,
            height: 70 * 4,
            touchable: true
        });
        _this.append(base);
        var sizeW = 210;
        var sizeH = 70;
        var colors = ["black", "red", "yellow", "#00FF00", "cyan", "magenta"];
        //パネル
        var panels = [];
        for (var y = 0; y < 4; y++) {
            panels[y] = [];
            for (var x = 0; x < 6; x++) {
                var panel = new g.FrameSprite({
                    scene: scene,
                    width: sizeW,
                    height: sizeH,
                    src: scene.assets["panel"],
                    frames: [0, 1, 2, 3, 4, 5]
                });
                base.append(panel);
                panels[y][x] = panel;
            }
        }
        //エフェクト
        var effects = [];
        for (var i = 0; i < 50; i++) {
            var effect = new g.FilledRect({
                scene: scene,
                width: sizeH,
                height: sizeH,
                cssColor: "black",
                opacity: 0
            });
            base.append(effect);
            effects[i] = effect;
        }
        //コンボのカウント用
        var labels = [];
        for (var i = 0; i < 50; i++) {
            var label = new g.Label({
                scene: scene,
                font: scene.numFontP,
                fontSize: 50,
                text: "0",
                opacity: 0
            });
            base.append(label);
            labels[i] = label;
        }
        //加算するスコア
        var labelBase = new g.E({
            scene: scene,
            x: 120,
            y: -20
        });
        base.append(labelBase);
        labelBase.hide();
        var labelScore = new g.Label({
            scene: scene,
            x: 50,
            y: 0,
            font: scene.numFontY,
            fontSize: 50,
            text: "+0P"
        });
        labelBase.append(labelScore);
        var num = 0;
        var speed = 10;
        var panelBk = [];
        var panelColorNow = 0;
        var comboCnt = 0;
        var frameCnt = 0;
        _this.update.add(function () {
            //移動
            num -= speed;
            if (-num > sizeW) {
                num = num + sizeW;
                for (var y = 0; y < panels.length; y++) {
                    for (var x = 0; x < panels[y].length; x++) {
                        if (x < panels[y].length - 1) {
                            if (x == 0)
                                panelBk[y] = panels[y][x];
                            panels[y][x] = panels[y][x + 1];
                        }
                        else {
                            panels[y][x] = panelBk[y];
                            panels[y][x].x = sizeW * x + num;
                            var max = Math.floor(frameCnt / 30) < 35 ? 0 : 1;
                            var c = scene.random.get(0, max) == 1 ? panels[y][x - 1].frameNumber : scene.random.get(1, 5);
                            panels[y][x].frameNumber = c;
                        }
                        panels[y][x].modified();
                    }
                }
            }
            for (var y = 0; y < panels.length; y++) {
                for (var x = 0; x < panels[y].length; x++) {
                    panels[y][x].x -= speed;
                    panels[y][x].modified();
                }
            }
            //消す
            if (isPush) {
                var x = Math.floor((px - num - 20) / sizeW);
                var y = Math.floor(py / sizeH);
                if (y < 0 || y >= 4) {
                    isPush = false;
                    lines.forEach(function (e) {
                        e.cssColor = "red";
                        e.modified();
                    });
                    scene.playSound("se_trush");
                    return;
                }
                var panel = panels[y][x];
                if (panel.frameNumber !== 0) {
                    if (panelColorNow == 0 || panelColorNow == panel.frameNumber) {
                        var _loop_1 = function (i) {
                            var effect = effects.pop();
                            effect.opacity = 0.8;
                            effect.cssColor = colors[panel.frameNumber];
                            effect.x = panel.x + (70 * i);
                            effect.y = panel.y;
                            effect.angle = 0;
                            effect.modified();
                            timeline.create().wait(i * 30).every(function () {
                                effect.x -= speed;
                                effect.y -= 3;
                                effect.angle += 20;
                                effect.opacity -= 0.04;
                                effect.modified();
                            }, 500).call(function () {
                                effect.opacity = 0;
                                effect.modified();
                            });
                            effects.unshift(effect);
                        };
                        //エフェクト表示
                        for (var i = 0; i < 3; i++) {
                            _loop_1(i);
                        }
                        //コンボ数表示
                        var label_1 = labels.pop();
                        label_1.text = "" + (comboCnt + 1);
                        label_1.x = panel.x + 70;
                        label_1.y = panel.y;
                        label_1.opacity = 1;
                        label_1.invalidate();
                        timeline.create().every(function () {
                            label_1.x -= speed;
                            label_1.y -= 3;
                            label_1.opacity -= 0.04;
                            label_1.modified();
                        }, 300).call(function () {
                            label_1.opacity = 0;
                            label_1.modified();
                        });
                        labels.unshift(label_1);
                        scene.playSound("coin0" + ((panel.frameNumber % 3) + 2));
                        panelColorNow = panel.frameNumber;
                        comboCnt++;
                        panel.frameNumber = 0;
                        lines.forEach(function (e) {
                            e.cssColor = "yellow";
                            e.modified();
                        });
                    }
                    else {
                        isPush = false;
                        lines.forEach(function (e) {
                            e.cssColor = "red";
                            e.modified();
                        });
                        scene.playSound("se_trush");
                    }
                }
            }
            frameCnt++;
            if (frameCnt % (30 * 5) == 0 && frameCnt < (30 * 70)) {
                speed += 1;
            }
        });
        var isPush = false;
        var px = 0;
        var py = 0;
        base.pointDown.add(function (e) {
            if (!scene.isStart)
                return;
            isPush = true;
            px = e.point.x;
            py = e.point.y;
            panelColorNow = 0;
            comboCnt = 0;
        });
        base.pointMove.add(function (e) {
            px = e.point.x + e.startDelta.x;
            py = e.point.y + e.startDelta.y;
        });
        var setScore = function () {
            if (isPush) {
                labelBase.show();
                var score = comboCnt * 100 + (comboCnt * comboCnt * 20);
                labelScore.text = "+" + score + "C";
                labelScore.invalidate();
                timeline.create().wait(500).call(function () {
                    labelBase.hide();
                });
                scene.addScore(score);
                if (comboCnt > 1)
                    scene.playSound("se_clear");
            }
            else {
                labelBase.show();
                labelScore.text = "+0C";
                labelScore.invalidate();
                timeline.create().wait(500).call(function () {
                    labelBase.hide();
                });
            }
            lines.forEach(function (e) {
                e.cssColor = "white";
                e.modified();
            });
            isPush = false;
        };
        base.pointUp.add(function (e) {
            if (!scene.isStart)
                return;
            setScore();
        });
        _this.finish = function () {
            setScore();
        };
        //リセット
        _this.reset = function () {
            comboCnt = 0;
            frameCnt = 0;
            panelColorNow = 0;
            isPush = false;
            speed = 10;
            num = 0;
            for (var y = 0; y < panels.length; y++) {
                for (var x = 0; x < panels[y].length; x++) {
                    var panel = panels[y][x];
                    panel.x = sizeW * x;
                    panel.y = sizeH * y;
                    panel.frameNumber = 0;
                    panel.modified();
                }
            }
        };
        return _this;
    }
    return MainGame;
}(g.E));
exports.MainGame = MainGame;
