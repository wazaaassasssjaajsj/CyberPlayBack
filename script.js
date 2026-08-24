const $ = id => document.getElementById(id);

// --- LOGIN ---
const USUARIO_VALIDO = "PedritoElMasRiko";
const CLAVE_VALIDA = "Pedrito_2026";

function mostrarApp(){
  $("loginGate").style.display = "none";
  $("mainApp").style.display = "block";
}
function mostrarLogin(){
  $("mainApp").style.display = "none";
  $("loginGate").style.display = "flex";
}

function intentarLogin(){
  const u = $("loginUser").value.trim();
  const p = $("loginPass").value;
  if (u === USUARIO_VALIDO && p === CLAVE_VALIDA){
    localStorage.setItem("sesion_activa", "1");
    mostrarApp();
  } else {
    $("loginError").style.display = "block";
  }
}
$("btnLogin").addEventListener("click", intentarLogin);
$("loginPass").addEventListener("keydown", e=>{ if(e.key==="Enter") intentarLogin(); });
$("btnLogout").addEventListener("click", ()=>{
  localStorage.removeItem("sesion_activa");
  $("loginUser").value = ""; $("loginPass").value = "";
  mostrarLogin();
});

if (localStorage.getItem("sesion_activa") === "1"){
  mostrarApp();
}

// --- CALIBRADOR ---
const REQUERIDOS = ["general","punto_rojo","x2","x4"];
const todas = ["general","punto_rojo","x2","x4","awm","camara"];

$("gama").addEventListener("change", ()=>{
  $("dpiManual").classList.toggle("hidden", $("gama").value !== "custom");
});

function obtenerDpi(){
  if ($("gama").value === "custom"){
    return Math.min(1000, Math.max(100, Number($("dpiManual").value) || 400));
  }
  return Number($("gama").value);
}

function nombreSituacion(v){
  return {
    no_sube: "La mira no sube",
    se_pasa: "La mira se pasa de la cabeza",
    giros: "Cuesta hacer giros rápidos 360°",
    consistencia: "Pierdo consistencia"
  }[v];
}

const TABLA_AJUSTE = {
  no_sube:      { general: 1.18, punto_rojo: 1.22, x2: 1.10, x4: 1.04 },
  se_pasa:      { general: 0.88, punto_rojo: 0.83, x2: 0.90, x4: 0.93 },
  giros:        { general: 1.25, punto_rojo: 1.06, x2: 1.02, x4: 1.00 },
  consistencia: { general: 1.03, punto_rojo: 1.03, x2: 1.02, x4: 1.02 },
};

const DPI_BASE = 400;

function calcular(situacion, dpi, valores){
  const tabla = TABLA_AJUSTE[situacion];

  let factorDpi = 1 - 0.3 * ((dpi - DPI_BASE) / DPI_BASE);
  factorDpi = Math.min(Math.max(factorDpi, 0.7), 1.3);

  const resultado = {...valores};
  REQUERIDOS.forEach(k=>{
    const factorMira = tabla[k];
    let v = valores[k] * factorMira * factorDpi;
    resultado[k] = Math.round(Math.min(Math.max(v,0),200));
  });

  return resultado;
}

let ultimoTexto = "";

function datosCompletos(){
  return REQUERIDOS.every(k=>{
    const v = $("n_"+k).value.trim();
    if (v === "") return false;
    const n = Number(v);
    return !isNaN(n) && n >= 0 && n <= 200;
  });
}

function actualizarVisibilidadBoton(){
  const listo = datosCompletos();
  $("ctaFixed").classList.toggle("hidden", !listo);
  $("avisoIncompleto").classList.toggle("hidden", listo);
}

REQUERIDOS.forEach(k=>{
  $("n_"+k).addEventListener("input", actualizarVisibilidadBoton);
});
actualizarVisibilidadBoton();

$("btnGenerar").addEventListener("click", ()=>{
  if (!datosCompletos()) return;

  const nombre = $("nombre").value.trim() || "Sin nombre";
  const situacion = document.querySelector('input[name="sit"]:checked').value;
  const dpi = obtenerDpi();
  const boton = $("boton").value.trim();

  const valores = {};
  todas.forEach(k=>{
    const raw = $("n_"+k).value.trim();
    valores[k] = raw === "" ? 0 : Number(raw);
  });

  const resultado = calcular(situacion, dpi, valores);

  const etiquetas = {
    general:"General", punto_rojo:"Punto rojo", x2:"Mira 2x", x4:"Mira 4x/8x",
    awm:"AWM / Sniper", camara:"Cámara / Free look"
  };

  let html = "";
  todas.forEach(k=>{
    const dim = (k==="awm"||k==="camara") ? " dim" : "";
    const valorMostrado = (k==="awm"||k==="camara") ? (valores[k] || "—") : resultado[k];
    html += `<div class="row${dim}"><span>${etiquetas[k]}</span><span>${valorMostrado}</span></div>`;
  });
  $("configOutput").innerHTML = html;

  let lineas = [];
  lineas.push("CALIBRACIÓN DE SENSIBILIDAD");
  lineas.push(`Dispositivo: ${nombre}`);
  lineas.push(`Situación: ${nombreSituacion(situacion)}`);
  if (boton) lineas.push(`Botón de disparo: ${boton}`);
  lineas.push("");
  todas.forEach(k=>{
    const valorMostrado = (k==="awm"||k==="camara") ? (valores[k] || "sin cambios") : resultado[k];
    lineas.push(`${etiquetas[k]}: ${valorMostrado}`);
  });

  ultimoTexto = lineas.join("\n");

  $("resultado").style.display = "block";
  $("resultado").scrollIntoView({ behavior: "smooth", block: "start" });
});

$("btnDescargar").addEventListener("click", ()=>{
  if (!ultimoTexto) return;
  const nombre = ($("nombre").value.trim() || "config").replace(/\s+/g,"_");
  const blob = new Blob([ultimoTexto], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `calibracion_${nombre}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

$("btnCopiar").addEventListener("click", ()=>{
  if (!ultimoTexto) return;
  navigator.clipboard.writeText(ultimoTexto).then(()=>{
    const b = $("btnCopiar");
    const original = b.textContent;
    b.textContent = "¡Copiado!";
    setTimeout(()=> b.textContent = original, 1500);
  });
});
