import { MainScene } from "./MainScene";
declare function require(x: string): any;

//メインのゲーム画面
export class MainGame extends g.E {
	public reset: () => void;
	public finish: () => void;
	public setMode: (num: number) => void;

	constructor(scene: MainScene) {
		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(scene);
		super({ scene: scene, x: 0, y: 0, width: 640, height: 360 });

		const bg = new g.FilledRect({
			scene: scene,
			width: 640,
			height: 360,
			cssColor: "black",
			opacity: 0.5
		});
		this.append(bg);

		//枠線
		const lines: g.FilledRect[] = [];
		const linePos = [5, 20 + (70 * 4) + 5];
		for (let i = 0; i < 2; i++) {
			const line = new g.FilledRect({
				scene: scene,
				x: 0,
				y: linePos[i],
				width: 640,
				height: 10,
				cssColor: "white",
				opacity: 0.8
			});
			lines.push(line);
			this.append(line);
		}

		const base = new g.E({
			scene: scene,
			y: 20,
			width: 640,
			height: 70 * 4,
			touchable: true
		});
		this.append(base);

		const sizeW = 210;
		const sizeH = 70;
		const colors = ["black", "red", "yellow", "#00FF00", "cyan", "magenta"];

		//パネル
		const panels: g.FrameSprite[][] = [];
		for (let y = 0; y < 4; y++) {
			panels[y] = [];
			for (let x = 0; x < 6; x++) {
				const panel = new g.FrameSprite({
					scene: scene,
					width: sizeW,
					height: sizeH,
					src: scene.assets["panel"] as g.ImageAsset,
					frames: [0, 1, 2, 3, 4, 5]
				});
				base.append(panel);
				panels[y][x] = panel;
			}
		}

		//エフェクト
		const effects: g.FilledRect[] = [];
		for (let i = 0; i < 50; i++) {
			const effect = new g.FilledRect({
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
		const labels: g.Label[] = [];
		for (let i = 0; i < 50; i++) {
			const label = new g.Label({
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
		const labelBase = new g.E({
			scene: scene,
			x: 120,
			y: -20
		});
		base.append(labelBase);
		labelBase.hide();

		const labelScore = new g.Label({
			scene: scene,
			x: 50,
			y: 0,
			font: scene.numFontY,
			fontSize: 50,
			text: "+0P"
		});
		labelBase.append(labelScore);

		let num = 0;
		let speed = 10;
		const panelBk: g.FrameSprite[] = [];
		let panelColorNow = 0;
		let comboCnt = 0;
		let frameCnt = 0;
		this.update.add(() => {

			//移動
			num -= speed;
			if (-num > sizeW) {
				num = num + sizeW;
				for (let y = 0; y < panels.length; y++) {
					for (let x = 0; x < panels[y].length; x++) {
						if (x < panels[y].length - 1) {
							if (x == 0) panelBk[y] = panels[y][x];
							panels[y][x] = panels[y][x + 1];
						} else {
							panels[y][x] = panelBk[y];
							panels[y][x].x = sizeW * x + num;
							const max = Math.floor(frameCnt / 30) < 35 ? 0 : 1;
							let c = scene.random.get(0, max) == 1 ? panels[y][x - 1].frameNumber : scene.random.get(1, 5);
							panels[y][x].frameNumber = c;
						}
						panels[y][x].modified();
					}
				}
			}

			for (let y = 0; y < panels.length; y++) {
				for (let x = 0; x < panels[y].length; x++) {
					panels[y][x].x -= speed;
					panels[y][x].modified();
				}
			}

			//消す
			if (isPush) {
				const x = Math.floor((px - num - 20) / sizeW);
				let y = Math.floor(py / sizeH);
				
				if (y < 0 || y >= 4) {
					isPush = false;

					lines.forEach((e) => {
						e.cssColor = "red";
						e.modified();
					});

					scene.playSound("se_trush");
					return;
				}

				const panel = panels[y][x];

				if (panel.frameNumber !== 0) {
					if (panelColorNow == 0 || panelColorNow == panel.frameNumber) {
						//エフェクト表示
						for (let i = 0; i < 3; i++) {
							const effect = effects.pop();
							effect.opacity = 0.8;
							effect.cssColor = colors[panel.frameNumber];
							effect.x = panel.x + (70 * i);
							effect.y = panel.y;
							effect.angle = 0;
							effect.modified();

							timeline.create().wait(i * 30).every(() => {
								effect.x -= speed;
								effect.y -= 3;
								effect.angle += 20;
								effect.opacity -= 0.04;
								effect.modified();
							}, 500).call(() => {
								effect.opacity = 0;
								effect.modified();
							})
							effects.unshift(effect);

						}

						//コンボ数表示
						const label = labels.pop();
						label.text = "" + (comboCnt + 1);
						label.x = panel.x + 70;
						label.y = panel.y;
						label.opacity = 1;
						label.invalidate();
						timeline.create().every(() => {
							label.x -= speed;
							label.y -= 3;
							label.opacity -= 0.04;
							label.modified();
						}, 300).call(() => {
							label.opacity = 0;
							label.modified();
						})
						labels.unshift(label);

						scene.playSound("coin0" + ((panel.frameNumber % 3) + 2));

						panelColorNow = panel.frameNumber;
						comboCnt++;
						panel.frameNumber = 0;

						lines.forEach((e) => {
							e.cssColor = "yellow";
							e.modified();
						});


					} else {
						isPush = false;

						lines.forEach((e) => {
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

		let isPush = false;
		let px = 0;
		let py = 0;
		base.pointDown.add((e) => {
			if (!scene.isStart) return;
			isPush = true;
			px = e.point.x;
			py = e.point.y;
			panelColorNow = 0;
			comboCnt = 0;
		});

		base.pointMove.add((e) => {
			px = e.point.x + e.startDelta.x;
			py = e.point.y + e.startDelta.y;
		})


		const setScore = () => {
			if (isPush) {
				labelBase.show();
				const score = comboCnt * 100 + (comboCnt * comboCnt * 20);
				labelScore.text = "+" + score + "C";
				labelScore.invalidate();
				timeline.create().wait(500).call(() => {
					labelBase.hide();
				});
				scene.addScore(score);

				if (comboCnt > 1) scene.playSound("se_clear");
			} else {
				labelBase.show();
				labelScore.text = "+0C";
				labelScore.invalidate();
				timeline.create().wait(500).call(() => {
					labelBase.hide();
				});
			}

			lines.forEach((e) => {
				e.cssColor = "white";
				e.modified();
			});

			isPush = false;
		}

		base.pointUp.add((e) => {
			if (!scene.isStart) return;
			setScore();
		});

		this.finish = () => {
			setScore();
		}

		//リセット
		this.reset = () => {
			comboCnt = 0;
			frameCnt = 0;
			panelColorNow = 0;
			isPush = false;
			speed = 10;
			num = 0;
			for (let y = 0; y < panels.length; y++) {
				for (let x = 0; x < panels[y].length; x++) {
					const panel = panels[y][x];
					panel.x = sizeW * x;
					panel.y = sizeH * y;
					panel.frameNumber = 0;
					panel.modified();
				}
			}
		};

	}
}
