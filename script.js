const $ = id => document.getElementById(id);

// ============ LOGIN ============
const USUARIO_VALIDO ="Balta.Monkey";
const CLAVE_VALIDA = "M.B_2026";

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

// ============ NAVEGACION (hamburguesa + vistas) ============
const navMenu = $("navMenu");
const navOverlay = $("navOverlay");

function abrirMenu(){ navMenu.classList.add("open"); navOverlay.classList.add("show"); }
function cerrarMenu(){ navMenu.classList.remove("open"); navOverlay.classList.remove("show"); }

$("btnMenu").addEventListener("click", abrirMenu);
navOverlay.addEventListener("click", cerrarMenu);

function irAVista(nombre){
  document.querySelectorAll(".vista").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".navlink").forEach(l => l.classList.remove("active"));
  $("vista" + nombre.charAt(0).toUpperCase() + nombre.slice(1)).classList.add("active");
  const link = document.querySelector(`.navlink[data-view="${nombre}"]`);
  if (link) link.classList.add("active");
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  cerrarMenu();
}

document.querySelectorAll(".navlink").forEach(link=>{
  link.addEventListener("click", e=>{
    e.preventDefault();
    irAVista(link.dataset.view);
  });
});
document.querySelectorAll(".ir-btn").forEach(btn=>{
  btn.addEventListener("click", ()=> irAVista(btn.dataset.goto));
});

// ============ CALIBRAR SENSIBILIDAD ============
const REQUERIDOS = ["general","punto_rojo","x2","x4"];
const todas = ["general","punto_rojo","x2","x4","awm","camara"];

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

function calcularAjuste(situacion, dpi, valores){
  const tabla = TABLA_AJUSTE[situacion];
  let factorDpi = 1 - 0.3 * ((dpi - DPI_BASE) / DPI_BASE);
  factorDpi = Math.min(Math.max(factorDpi, 0.7), 1.3);
  const resultado = {...valores};
  REQUERIDOS.forEach(k=>{
    let v = valores[k] * tabla[k] * factorDpi;
    resultado[k] = Math.round(Math.min(Math.max(v,0),200));
  });
  return resultado;
}

let ultimoTexto = "";

function datosCompletosCalibrar(){
  return REQUERIDOS.every(k=>{
    const v = $("n_"+k).value.trim();
    if (v === "") return false;
    const n = Number(v);
    return !isNaN(n) && n >= 0 && n <= 200;
  });
}

function actualizarBotonCalibrar(){
  const listo = datosCompletosCalibrar();
  $("ctaFixed").classList.toggle("hidden", !listo);
  $("avisoIncompleto").classList.toggle("hidden", listo);
}

REQUERIDOS.forEach(k=>{
  $("n_"+k).addEventListener("input", actualizarBotonCalibrar);
});
actualizarBotonCalibrar();

$("btnCalibrar").addEventListener("click", ()=>{
  if (!datosCompletosCalibrar()) return;

  const nombre = $("nombre").value.trim() || "Sin nombre";
  const situacion = document.querySelector('input[name="sit"]:checked').value;
  const dpi = Math.min(1000, Math.max(50, Number($("dpiInput").value) || DPI_BASE));
  const boton = $("boton").value.trim();

  const valores = {};
  todas.forEach(k=>{
    const raw = $("n_"+k).value.trim();
    valores[k] = raw === "" ? 0 : Number(raw);
  });

  const resultado = calcularAjuste(situacion, dpi, valores);

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

  $("resultadoCalibrar").scrollIntoView({ behavior: "smooth", block: "start" });
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

// ============ GENERAR SENSIBILIDAD ============
/*
  Perfiles base por gama. A diferencia del Calibrador (que AJUSTA una
  sensibilidad existente segun un problema puntual), esto GENERA un
  perfil completo desde cero, pensado para arrancar a jugar. Cada gama
  sube un poco todos los valores respecto a la anterior porque un
  tactil mas rapido/preciso banca sensibilidades mas altas sin perder
  control; y dentro de cada perfil la sensibilidad baja a medida que
  sube el zoom (General > Punto rojo > 2x > 4x), que es el patron
  general reconocido por la comunidad para mantener precision a mas
  distancia.
*/
const PERFILES_GENERAR = {
  baja:  { general: 92,  punto_rojo: 85,  x2: 75,  x4: 65, awm: 60, camara: 90  },
  media: { general: 100, punto_rojo: 95,  x2: 85,  x4: 75, awm: 65, camara: 95  },
  alta:  { general: 108, punto_rojo: 103, x2: 92,  x4: 82, awm: 70, camara: 100 },
  gamer: { general: 115, punto_rojo: 110, x2: 98,  x4: 88, awm: 75, camara: 105 },
};

function actualizarBotonGenerar(){
  const listo = $("modeloGen").value !== "";
  $("ctaGenerar").classList.toggle("hidden", !listo);
  $("avisoGenerar").classList.toggle("hidden", listo);
}
$("modeloGen").addEventListener("change", actualizarBotonGenerar);
actualizarBotonGenerar();

function dibujarConfiguracion(nombre, modeloTexto, valores){
  const canvas = $("canvasResultado");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  // Fondo
  ctx.fillStyle = "#171a20";
  ctx.fillRect(0,0,W,H);
  ctx.strokeStyle = "#2a2f38";
  ctx.lineWidth = 2;
  ctx.strokeRect(1,1,W-2,H-2);

  // Encabezado
  ctx.fillStyle = "#7dd3fc";
  ctx.font = "600 15px 'JetBrains Mono', monospace";
  ctx.fillText("// CYBERPLAYBACK", 40, 60);

  ctx.fillStyle = "#eae7e0";
  ctx.font = "700 34px 'Oswald', sans-serif";
  ctx.fillText("CONFIGURACIÓN", 40, 105);
  ctx.fillText("GENERADA", 40, 145);

  ctx.fillStyle = "#8b92a1";
  ctx.font = "500 15px 'Inter', sans-serif";
  ctx.fillText(`Dispositivo: ${nombre}`, 40, 185);
  ctx.fillText(`Modelo: ${modeloTexto}`, 40, 208);

  // Linea separadora
  ctx.strokeStyle = "#2a2f38";
  ctx.beginPath();
  ctx.moveTo(40, 235);
  ctx.lineTo(W-40, 235);
  ctx.stroke();

  // Filas de valores
  const etiquetas = [
    ["General", valores.general],
    ["Punto rojo", valores.punto_rojo],
    ["Mira 2x", valores.x2],
    ["Mira 4x / 8x", valores.x4],
    ["AWM / Sniper", valores.awm],
    ["Cámara / Free look", valores.camara],
  ];

  let y = 285;
  etiquetas.forEach(([label, valor])=>{
    ctx.fillStyle = "#8b92a1";
    ctx.font = "500 17px 'Inter', sans-serif";
    ctx.fillText(label, 40, y);

    ctx.fillStyle = "#c6ff3d";
    ctx.font = "700 22px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(String(valor), W-40, y+2);
    ctx.textAlign = "left";

    y += 68;
  });

  // Pie
  ctx.strokeStyle = "#2a2f38";
  ctx.beginPath();
  ctx.moveTo(40, y+10);
  ctx.lineTo(W-40, y+10);
  ctx.stroke();

  ctx.fillStyle = "#5b6270";
  ctx.font = "400 12px 'JetBrains Mono', monospace";
  ctx.fillText("cyberplayback.site", 40, y+40);
}

$("btnGenerar").addEventListener("click", ()=>{
  const modeloSelect = $("modeloGen");
  const tier = modeloSelect.value;
  if (!tier) return;

  const nombre = $("nombreGen").value.trim() || "Sin nombre";
  const modeloTexto = modeloSelect.options[modeloSelect.selectedIndex].text;
  const valores = PERFILES_GENERAR[tier];

  // Esperamos a que la fuente Oswald/JetBrains este cargada antes de dibujar,
  // para que el canvas no se vea con la tipografia generica del sistema.
  document.fonts.ready.then(()=>{
    dibujarConfiguracion(nombre, modeloTexto, valores);
    $("resultadoGenerar").classList.remove("hidden");
    $("resultadoGenerar").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
