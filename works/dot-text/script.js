const canvas = document.querySelector("#dot-canvas");
const ctx = canvas.getContext("2d");

const textInput = document.querySelector("#text-input");
const colorInput = document.querySelector("#dot-color");
const sizeInput = document.querySelector("#dot-size");
const shapeInput = document.querySelector("#dot-shape");

// 文字の形を調べるための、画面には表示しないキャンバス
const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d", {
  willReadFrequently: true,
});

function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (!width || !height) return;

  // 高解像度の画面でも、ドットがぼやけないようにする
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const text = textInput.value;

  canvas.setAttribute(
    "aria-label",
    text ? `「${text}」のドット表示` : "文字が未入力です"
  );

  if (!text.trim()) return;

  textCanvas.width = Math.round(width);
  textCanvas.height = Math.round(height);

  const fontFamily = 'Arial, "Hiragino Kaku Gothic ProN", sans-serif';
  let fontSize = height * 0.56;

  textCtx.font = `900 ${fontSize}px ${fontFamily}`;

  // 長い文字列も枠内に収まるように縮小する
  const maxTextWidth = width * 0.84;
  const measuredWidth = textCtx.measureText(text).width;

  if (measuredWidth > maxTextWidth) {
    fontSize *= maxTextWidth / measuredWidth;
  }

  textCtx.font = `900 ${fontSize}px ${fontFamily}`;
  textCtx.textAlign = "center";
  textCtx.textBaseline = "alphabetic";
  textCtx.fillStyle = "#000";

  // 文字の実際の高さを使って、上下中央に配置する
  const metrics = textCtx.measureText(text);
  const baseline =
    height / 2 +
    (metrics.actualBoundingBoxAscent -
      metrics.actualBoundingBoxDescent) / 2;

  textCtx.fillText(text, width / 2, baseline);

  const image = textCtx.getImageData(
    0,
    0,
    textCanvas.width,
    textCanvas.height
  );

  const dotSize = Number(sizeInput.value);
  const spacing = dotSize + 1.5;

  ctx.fillStyle = colorInput.value;
  ctx.beginPath();

  // 一定間隔で文字の形を調べ、文字のある場所にだけ点を置く
  for (let y = spacing / 2; y < image.height; y += spacing) {
    for (let x = spacing / 2; x < image.width; x += spacing) {
      const index =
        (Math.floor(y) * image.width + Math.floor(x)) * 4;

      const opacity = image.data[index + 3];

      if (opacity < 128) continue;

      if (shapeInput.value === "square") {
        ctx.rect(
          x - dotSize / 2,
          y - dotSize / 2,
          dotSize,
          dotSize
        );
      } else {
        ctx.moveTo(x + dotSize / 2, y);
        ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
      }
    }
  }

  ctx.fill();
}

// 文字や設定を変えたら、その場で描き直す
textInput.addEventListener("input", draw);
colorInput.addEventListener("input", draw);
sizeInput.addEventListener("input", draw);
shapeInput.addEventListener("change", draw);

// 表示エリアの大きさが変わったときも描き直す
const resizeObserver = new ResizeObserver(draw);
resizeObserver.observe(canvas);

window.addEventListener("resize", draw);
document.fonts.ready.then(draw);

draw();
