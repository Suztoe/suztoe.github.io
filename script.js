const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const canvas = $("#canvas");
const ctx = canvas.getContext("2d");
const stage = $("#stage");
const empty = $("#empty");

const state = {
  image: null,
  rotation: 0,
  flipped: false,
  zoom: 100,
  filter: "none",
  format: "png",
  template: null,
  templateImage: null,
  selectedTextId: null,
  textLayers: [],
  values: { brightness: 100, contrast: 100, saturation: 100 },
  templates: []
};

const builtInTemplates = [
  ["sunset", "GOOD<br>VIBES", "サンセットポスター", "イベント / ポスター"],
  ["travel", "TRAVEL<br>NOTES", "トラベルノート", "旅行 / ストーリー"],
  ["beauty", "NEW<br>MOOD", "ビューティーカバー", "美容 / SNS投稿"],
  ["nature", "GO<br>OUTSIDE", "ネイチャー", "ライフスタイル"],
  ["night", "AFTER<br>DARK", "ナイトイベント", "音楽 / イベント"],
  ["sale", "SALE<br>DAY", "セールバナー", "ショップ / 告知"]
];
const templateColors = {
  sunset: ["#f49c78", "#252c68"], travel: ["#142b4a", "#f2c07d"],
  beauty: ["#f4d6c8", "#6d4e9b"], nature: ["#e8f2ee", "#305b62"],
  night: ["#252735", "#d2a4c5"], sale: ["#f8e9be", "#df6b5a"]
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  if (state.templateImage) {
    ctx.drawImage(state.templateImage, 0, 0, canvas.width, canvas.height);
  } else if (state.template) {
    const colors = templateColors[state.template] || ["#ddd", "#888"];
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (state.image) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(state.rotation * Math.PI / 180);
    ctx.scale(state.flipped ? -1 : 1, 1);
    const scale = Math.max(canvas.width / state.image.width, canvas.height / state.image.height);
    const adjustment = `brightness(${state.values.brightness}%) contrast(${state.values.contrast}%) saturate(${state.values.saturation}%)`;
    ctx.filter = state.filter === "none" ? adjustment : `${state.filter} ${adjustment}`;
    ctx.globalAlpha = state.template ? .7 : 1;
    ctx.drawImage(state.image, -state.image.width * scale / 2, -state.image.height * scale / 2, state.image.width * scale, state.image.height * scale);
  }
  ctx.restore();
  renderTextLayers();
}

function renderTextLayers() {
  $$(".text-layer").forEach(node => node.remove());
  const scale = canvas.clientWidth / canvas.width;
  state.textLayers.forEach(layer => {
    const node = document.createElement("div");
    node.className = `text-layer${layer.id === state.selectedTextId ? " selected" : ""}`;
    node.dataset.id = layer.id;
    node.textContent = layer.text;
    node.style.left = `${layer.x / canvas.width * 100}%`;
    node.style.top = `${layer.y / canvas.height * 100}%`;
    node.style.fontSize = `${layer.size * scale}px`;
    node.style.color = layer.color;
    node.addEventListener("pointerdown", startTextDrag);
    node.addEventListener("click", () => selectText(layer.id));
    stage.append(node);
  });
}

function selectText(id) {
  state.selectedTextId = id;
  const layer = state.textLayers.find(item => item.id === id);
  $("#text-input").value = layer?.text || "";
  $("#text-size").value = layer?.size || 48;
  $("#text-size-out").textContent = `${$("#text-size").value}px`;
  $("#text-color").value = layer?.color || "#ffffff";
  $("#delete-text").disabled = !layer;
  renderTextLayers();
}

function addText() {
  const input = $("#text-input");
  const text = input.value.trim() || "テキスト";
  const layer = {
    id: `${Date.now()}-${Math.random()}`,
    text,
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: Number($("#text-size").value),
    color: $("#text-color").value
  };
  state.textLayers.push(layer);
  empty.style.display = "none";
  selectText(layer.id);
  input.focus();
  input.select();
}

function startTextDrag(event) {
  event.preventDefault();
  const layer = state.textLayers.find(item => item.id === event.currentTarget.dataset.id);
  if (!layer) return;
  selectText(layer.id);
  const rect = canvas.getBoundingClientRect();
  const offsetX = event.clientX - (rect.left + layer.x / canvas.width * rect.width);
  const offsetY = event.clientY - (rect.top + layer.y / canvas.height * rect.height);
  const move = moveEvent => {
    layer.x = Math.max(0, Math.min(canvas.width, (moveEvent.clientX - rect.left - offsetX) / rect.width * canvas.width));
    layer.y = Math.max(0, Math.min(canvas.height, (moveEvent.clientY - rect.top - offsetY) / rect.height * canvas.height));
    renderTextLayers();
  };
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
}

function load(file) {
  const name = file?.name.toLowerCase() || "";
  const type = file?.type || "";
  if (!file || !(type.startsWith("image/") || /\.(heic|heif|webp|png|jpe?g|gif)$/i.test(name))) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => { state.image = image; empty.style.display = "none"; draw(); };
    image.onerror = () => alert("この画像形式はブラウザで読み込めません。JPEGまたはWebPに変換してお試しください。");
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function drawTextOnCanvas() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  state.textLayers.forEach(layer => {
    ctx.font = `700 ${layer.size}px "Noto Sans JP","Noto Sans",sans-serif`;
    ctx.fillStyle = layer.color;
    ctx.shadowColor = "#0006";
    ctx.shadowBlur = 4;
    ctx.fillText(layer.text, layer.x, layer.y);
  });
  ctx.restore();
}

function exportImage() {
  if (!state.image && !state.template && !state.textLayers.length) {
    $("#file-input").click();
    return;
  }
  draw();
  drawTextOnCanvas();
  const mime = state.format === "jpeg" ? "image/jpeg" : state.format === "webp" ? "image/webp" : "image/png";
  const link = document.createElement("a");
  link.download = `frame-${Date.now()}.${state.format}`;
  link.href = canvas.toDataURL(mime, .92);
  link.click();
}

function renderTemplates() {
  const list = state.templates.length ? state.templates : builtInTemplates.map(item => ({ id: item[0], title: item[1], name: item[2], description: item[3] }));
  const grid = $(".template-grid");
  grid.innerHTML = list.map(template => `<button class="template-card" data-template="${template.id}"><div class="template-preview" style="${template.image ? `background-image:url('${template.image}')` : ""}"><span>${template.title || ""}</span></div><div class="template-info"><strong>${template.name || template.id}</strong><small>${template.description || "画像テンプレート"}</small></div></button>`).join("");
  $$(".template-card", grid).forEach(button => button.addEventListener("click", () => {
    state.template = button.dataset.template;
    const selected = list.find(item => item.id === state.template);
    empty.style.display = "none";
    $("#template-modal").classList.remove("open");
    if (selected?.image) {
      const image = new Image();
      image.onload = () => { state.templateImage = image; draw(); };
      image.onerror = () => { state.templateImage = null; draw(); };
      image.src = selected.image;
    } else {
      state.templateImage = null;
      draw();
    }
  }));
}

async function loadTemplates() {
  try {
    const response = await fetch("templates/manifest.json", { cache: "no-store" });
    if (response.ok) state.templates = await response.json();
  } catch (error) {
    state.templates = [];
  }
  renderTemplates();
}

$("#file-input").addEventListener("change", event => load(event.target.files[0]));
["dragover", "dragenter"].forEach(type => stage.addEventListener(type, event => { event.preventDefault(); stage.classList.add("dragging"); }));
["dragleave", "drop"].forEach(type => stage.addEventListener(type, event => { event.preventDefault(); stage.classList.remove("dragging"); }));
stage.addEventListener("drop", event => load(event.dataTransfer.files[0]));
$("#add-text").addEventListener("click", addText);
$("#quick-text").addEventListener("click", addText);
$("#mobile-text").addEventListener("click", addText);
$("#text-input").addEventListener("input", event => {
  const layer = state.textLayers.find(item => item.id === state.selectedTextId);
  if (layer) { layer.text = event.target.value; draw(); }
});
$("#text-size").addEventListener("input", event => {
  const layer = state.textLayers.find(item => item.id === state.selectedTextId);
  $("#text-size-out").textContent = `${event.target.value}px`;
  if (layer) { layer.size = Number(event.target.value); draw(); }
});
$("#text-color").addEventListener("input", event => {
  const layer = state.textLayers.find(item => item.id === state.selectedTextId);
  if (layer) { layer.color = event.target.value; draw(); }
});
$("#delete-text").addEventListener("click", () => {
  const index = state.textLayers.findIndex(item => item.id === state.selectedTextId);
  if (index >= 0) { state.textLayers.splice(index, 1); state.selectedTextId = null; selectText(null); draw(); }
});
$("#file-input").accept = "image/*,.heic,.heif";
$$(".filter").forEach(button => button.addEventListener("click", () => {
  $(".filter.selected").classList.remove("selected");
  button.classList.add("selected");
  state.filter = button.dataset.filter;
  draw();
}));
["brightness", "contrast", "saturation"].forEach(key => {
  const input = $(`#${key}`);
  input.addEventListener("input", () => { state.values[key] = input.value; $(`#${key}-out`).textContent = `${input.value}%`; draw(); });
});
$$(".ratio button").forEach(button => button.addEventListener("click", () => {
  $(".ratio .active").classList.remove("active");
  button.classList.add("active");
  const ratio = button.dataset.ratio;
  stage.style.aspectRatio = ratio;
  canvas.width = ratio === "1/1" ? 1000 : ratio === "16/9" ? 1600 : ratio === "9/16" ? 900 : 1200;
  canvas.height = ratio === "1/1" ? 1000 : ratio === "16/9" ? 900 : ratio === "9/16" ? 1600 : 900;
  draw();
}));
$$(".format button").forEach(button => button.addEventListener("click", () => {
  $(".format .active").classList.remove("active");
  button.classList.add("active");
  state.format = button.dataset.format;
}));
const rotate = () => { state.rotation = (state.rotation + 90) % 360; draw(); };
$("#rotate").addEventListener("click", rotate);
$("#mobile-rotate").addEventListener("click", rotate);
$("#quick-rotate").addEventListener("click", rotate);
const flip = () => { state.flipped = !state.flipped; draw(); };
$("#flip").addEventListener("click", flip);
$("#quick-flip").addEventListener("click", flip);
$("#grayscale").addEventListener("click", () => $('[data-filter="grayscale(1)"]').click());
$("#quick-adjust").addEventListener("click", () => $(".panel").scrollIntoView({ behavior: "smooth" }));
$("#download").addEventListener("click", exportImage);
$("#mobile-download").addEventListener("click", exportImage);
$("#reset").addEventListener("click", () => {
  state.image = null; state.template = null; state.templateImage = null; state.textLayers = []; state.selectedTextId = null;
  state.rotation = 0; state.flipped = false; state.filter = "none";
  Object.assign(state.values, { brightness: 100, contrast: 100, saturation: 100 });
  ["brightness", "contrast", "saturation"].forEach(key => { $(`#${key}`).value = 100; $(`#${key}-out`).textContent = "100%"; });
  $(".filter.selected").classList.remove("selected"); $('[data-filter="none"]').classList.add("selected");
  $("#text-input").value = ""; $("#delete-text").disabled = true; empty.style.display = "grid"; draw();
});
function setZoom(next) { state.zoom = Math.round(Math.max(70, Math.min(150, next))); $("#zoom-label").textContent = `${state.zoom}%`; stage.style.transform = `scale(${state.zoom / 100})`; }
$("#zoom-in").addEventListener("click", () => setZoom(state.zoom + 10));
$("#zoom-out").addEventListener("click", () => setZoom(state.zoom - 10));
const templateButton = document.createElement("button");
templateButton.className = "tool template-tool";
templateButton.innerHTML = '<span style="font-size:18px">▦</span><span>テンプレート</span>';
$(".sidebar").insertBefore(templateButton, $(".sidebar .tool:nth-of-type(2)"));
const templateModal = document.createElement("div");
templateModal.className = "modal";
templateModal.id = "template-modal";
templateModal.innerHTML = '<div class="modal-card"><div class="modal-head"><div><h2>テンプレートを選ぶ</h2><p>画像を置くだけで追加できます。</p></div><button class="close" aria-label="閉じる">×</button></div><div class="template-grid"></div></div>';
document.body.append(templateModal);
const openTemplateModal = () => { renderTemplates(); templateModal.classList.add("open"); };
templateButton.addEventListener("click", openTemplateModal);
$("#mobile-template").addEventListener("click", openTemplateModal);
$(".close", templateModal).addEventListener("click", () => templateModal.classList.remove("open"));
templateModal.addEventListener("click", event => { if (event.target === templateModal) templateModal.classList.remove("open"); });
let startDistance = 0;
let startZoom = state.zoom;
stage.addEventListener("touchstart", event => {
  if (event.touches.length === 2) { startDistance = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY); startZoom = state.zoom; }
}, { passive: true });
stage.addEventListener("touchmove", event => {
  if (event.touches.length === 2) { event.preventDefault(); const distance = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY); setZoom(startZoom + (distance - startDistance) / 3); }
}, { passive: false });
loadTemplates();
draw();
