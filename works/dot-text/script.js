"use strict";

// 表示用キャンバス
const canvas = document.querySelector("#dot-canvas");
const ctx = canvas.getContext("2d");

// 入力欄・操作部品
const textInput = document.querySelector("#text-input");
const colorInput = document.querySelector("#dot-color");
const shapeInput = document.querySelector("#dot-shape");
const sizeInput = document.querySelector("#dot-size");
const spacingInput = document.querySelector("#dot-spacing");
const cornerInput = document.querySelector("#dot-corner");
const saveButton = document.querySelector("#save-image");

// 設定値の表示
const shapeValue = document.querySelector("#shape-value");
const sizeValue = document.querySelector("#size-value");
const spacingValue = document.querySelector("#spacing-value");
const cornerValue = document.querySelector("#corner-value");

// 文字の形を調べるための非表示キャンバス
const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d", {
  willReadFrequently: true,
});

/**
 * 多角形のドットを作る
 *
 * sides: 頂点の数
 * size: ドットの最大幅または最大高さ
 * roundness: 角の丸み（0〜1）
 */
function createDotPath(sides, size, roundness) {
  const path = new Path2D();
  const vertices = [];

  // 四角形は辺が水平・垂直になる向き
  // その他の多角形は頂点が上になる向き
  const rotation =
    sides === 4 ? -Math.PI / 4 : -Math.PI / 2;

  for (let i = 0; i < sides; i++) {
    const angle =
      rotation + (i / sides) * Math.PI * 2;

    vertices.push({
      x: Math.cos(angle),
      y: Math.sin(angle),
    });
  }

  // 多角形の外接する幅・高さを求める
  const xs = vertices.map((point) => point.x);
  const ys = vertices.map((point) => point.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // 形を変更しても最大幅または最大高さをsizeに揃える
  const scale =
    size / Math.max(maxX - minX, maxY - minY);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  for (const point of vertices) {
    point.x = (point.x - centerX) * scale;
    point.y = (point.y - centerY) * scale;
  }

  // 丸みが0なら、そのまま多角形を描く
  if (roundness === 0) {
    vertices.forEach((point, index) => {
      if (index === 0) {
        path.moveTo(point.x, point.y);
      } else {
        path.lineTo(point.x, point.y);
      }
    });

    path.closePath();
    return path;
  }

  // 頂点の前後を曲線でつないで角を丸くする
  const amount = roundness * 0.5;

  vertices.forEach((point, index) => {
    const previous =
      vertices[(index - 1 + sides) % sides];

    const next =
      vertices[(index + 1) % sides];

    const start = {
      x: point.x + (previous.x - point.x) * amount,
      y: point.y + (previous.y - point.y) * amount,
    };

    const end = {
      x: point.x + (next.x - point.x) * amount,
      y: point.y + (next.y - point.y) * amount,
    };

    if (index === 0) {
      path.moveTo(start.x, start.y);
    } else {
      path.lineTo(start.x, start.y);
    }

    path.quadraticCurveTo(
      point.x,
      point.y,
      end.x,
      end.y
    );
  });

  path.closePath();
  return path;
}

/**
 * 現在の入力内容・設定で文字を描く
 */
function draw() {
  const size = Number(sizeInput.value);
  const sides = Number(shapeInput.value);
  const gap = Number(spacingInput.value);
  const roundness = Number(cornerInput.value) / 100;

  // 操作欄の数値を更新
  shapeValue.value = String(sides);
  sizeValue.value = String(size);
  spacingValue.value = String(gap);
  cornerValue.value = `${cornerInput.value}%`;

  shapeInput.setAttribute(
    "aria-valuetext",
    `${sides}角形`
  );

  cornerInput.setAttribute(
    "aria-valuetext",
    `${cornerInput.value}%`
  );

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (!width || !height) return;

  // 高解像度ディスプレイに対応
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);

  ctx.setTransform(
    pixelRatio,
    0,
    0,
    pixelRatio,
    0,
    0
  );

  // 背景色を塗らず、透明にする
  ctx.clearRect(0, 0, width, height);

  const text = textInput.value;

  canvas.setAttribute(
    "aria-label",
    text
      ? `「${text}」のドット表示`
      : "文字が未入力です"
  );

  if (!text.trim()) return;

  // 非表示キャンバスを初期化
  textCanvas.width = width;
  textCanvas.height = height;

  const fontFamily =
    'Arial, "Hiragino Kaku Gothic ProN", sans-serif';

  let fontSize = height * 0.56;

  textCtx.font = `900 ${fontSize}px ${fontFamily}`;

  // 長い文字列は表示エリアに収まるよう縮小
  const maxTextWidth = width * 0.84;
  const measuredWidth = textCtx.measureText(text).width;

  if (measuredWidth > maxTextWidth) {
    fontSize *= maxTextWidth / measuredWidth;
  }

  textCtx.font = `900 ${fontSize}px ${fontFamily}`;
  textCtx.textAlign = "center";
  textCtx.textBaseline = "alphabetic";
  textCtx.fillStyle = "#000";

  // 実際の文字の高さを使って上下中央に配置
  const metrics = textCtx.measureText(text);

  const baseline =
    height / 2 +
    (
      metrics.actualBoundingBoxAscent -
      metrics.actualBoundingBoxDescent
    ) / 2;

  textCtx.fillText(
    text,
    width / 2,
    baseline
  );

  // 文字がある場所をピクセルから判定
  const image = textCtx.getImageData(
    0,
    0,
    textCanvas.width,
    textCanvas.height
  );

  const dotPath = createDotPath(
    sides,
    size,
    roundness
  );

  // spacingを変えてもドット自体の大きさは変えない
  const pitch = size + gap;

  const columns =
    Math.floor((image.width - size) / pitch) + 1;

  const rows =
    Math.floor((image.height - size) / pitch) + 1;

  // 点の並びを表示エリアの中央に揃える
  const startX =
    (image.width - (columns - 1) * pitch) / 2;

  const startY =
    (image.height - (rows - 1) * pitch) / 2;

  ctx.fillStyle = colorInput.value;

  for (let row = 0; row < rows; row++) {
    const y = startY + row * pitch;

    for (let column = 0; column < columns; column++) {
      const x = startX + column * pitch;

      const index =
        (
          Math.floor(y) * image.width +
          Math.floor(x)
        ) * 4;

      // 文字がない場所にはドットを置かない
      if (image.data[index + 3] < 128) continue;

      ctx.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        x * pixelRatio,
        y * pixelRatio
      );

      ctx.fill(dotPath);
    }
  }

  // 座標変換を元に戻す
  ctx.setTransform(
    pixelRatio,
    0,
    0,
    pixelRatio,
    0,
    0
  );
}

/**
 * 連続操作時の描画を画面更新に合わせる
 */
let drawRequested = false;

function requestDraw() {
  if (drawRequested) return;

  drawRequested = true;

  requestAnimationFrame(() => {
    drawRequested = false;
    draw();
  });
}

// 入力や設定変更を即座に反映
[
  textInput,
  colorInput,
  shapeInput,
  sizeInput,
  spacingInput,
  cornerInput,
].forEach((input) => {
  input.addEventListener("input", requestDraw);
});

// 表示エリアのサイズ変更に対応
const resizeObserver = new ResizeObserver(requestDraw);
resizeObserver.observe(canvas);

window.addEventListener("resize", requestDraw);

// フォント読み込み後に再描画
document.fonts.ready.then(requestDraw);

/**
 * 背景が透明なPNGとして保存
 */
saveButton.addEventListener("click", () => {
  if (!textInput.value.trim()) {
    textInput.focus();
    return;
  }

  // 最新の設定を反映してから保存
  draw();

  saveButton.disabled = true;

  try {
    canvas.toBlob((blob) => {
      try {
        if (!blob) {
          throw new Error("PNGの生成に失敗しました。");
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        // ダウンロード後に一時URLを解放
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 10000);

        link.href = url;
        link.download = "dot-text.png";

        document.body.appendChild(link);

        try {
          link.click();
        } finally {
          link.remove();
        }
      } catch (error) {
        console.error(error);
        alert(
          "画像を保存できませんでした。もう一度お試しください。"
        );
      } finally {
        saveButton.disabled = false;
      }
    }, "image/png");
  } catch (error) {
    console.error(error);
    saveButton.disabled = false;

    alert(
      "画像を保存できませんでした。もう一度お試しください。"
    );
  }
});

// 初回描画
requestDraw();