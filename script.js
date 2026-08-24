const $ = id => document.getElementById(id);

// --- LOGIN ---
// Filtro simple, NO es seguridad real: el usuario/clave quedan
// visibles en este archivo para quien lo inspeccione. Sirve para
// que no cualquiera entre de curioso, no para proteger algo sensible.
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

// --- GENERADOR DE SENSIBILIDAD ---
const claves = ["general","punto_rojo","x2","x4"];
const todas = ["general","punto_rojo","x2","x4","awm","camara"];

todas.forEach(k=>{
  const range = $("v_"+k), num = $("n_"+k);
  range.addEventListener("input", ()=> num.value = range.value);
  num.addEventListener("input", ()=>{
    let v = Math.min(200, Math.max(0, Number(num.value)||0));
    range.value = v;
  });
});

$("gama").addEventListener("change", ()=>{
  $("dpiManual").classList.toggle("hidden", $("gama").value !== "custom");
});

function obtenerDpi(){
  if ($("gama").value === "custom"){
    return Math.min(1000, Math.max(100, Number($("dpiManual").value) || 411));
  }
  return Number($("gama").value);
}

function nombreSituacion(v){
  return {
    no_sube: "La mira no sube (poco retroceso controlado)",
    se_pasa: "La mira se pasa de la cabeza",
    giros: "Cuesta hacer giros rápidos 360°",
    consistencia: "Buena puntería pero pierdo consistencia"
  }[v];
}

function calcular(situacion, dpi, valores){
  let factorSituacion = 1, notaSituacion = "";
  if (situacion === "no_sube"){ factorSituacion = 1.15; notaSituacion = "Se subió la sensibilidad (general, punto rojo, 2x, 4x) para compensar recoil bajo."; }
  else if (situacion === "se_pasa"){ factorSituacion = 0.85; notaSituacion = "Se bajó la sensibilidad (general, punto rojo, 2x, 4x) para dar más control fino."; }
  else if (situacion === "giros"){ factorSituacion = 1.20; notaSituacion = "Se subió la sensibilidad (general, punto rojo, 2x, 4x) para giros más rápidos."; }
  else { factorSituacion = 1.02; notaSituacion = "Ajuste mínimo: el problema es más de práctica que de configuración."; }

  const dpiBase = 411;
  let factorDpi = 1 - 0.3 * ((dpi - dpiBase) / dpiBase);
  factorDpi = Math.min(Math.max(factorDpi, 0.7), 1.3);

  const resultado = {...valores};
  claves.forEach(k=>{
    let v = valores[k] * factorSituacion * factorDpi;
    resultado[k] = Math.round(Math.min(Math.max(v,0),200));
  });

  const notaDpi = dpi > dpiBase
    ? "DPI del sistema por encima del valor de fábrica: se compensó bajando un poco la sensibilidad del juego."
    : (dpi < dpiBase ? "DPI del sistema por debajo del valor de fábrica: se compensó subiendo un poco la sensibilidad del juego." : "DPI en valor de fábrica: sin ajuste adicional por DPI.");

  return { resultado, notas: [notaSituacion, notaDpi, "AWM/Sniper y Cámara (free look) se dejaron SIN modificar."] };
}

let ultimoTexto = "";

$("btnGenerar").addEventListener("click", ()=>{
  const nombre = $("nombre").value.trim() || "Dispositivo sin nombre";
  const situacion = document.querySelector('input[name="sit"]:checked').value;
  const dpi = obtenerDpi();
  const boton = $("boton").value.trim();

  const valores = {};
  todas.forEach(k=> valores[k] = Number($("n_"+k).value) || 0);

  const { resultado, notas } = calcular(situacion, dpi, valores);

  const etiquetas = {
    general:"General", punto_rojo:"Punto rojo", x2:"Mira 2x", x4:"Mira 4x/8x",
    awm:"AWM / Sniper", camara:"Cámara / Free look"
  };

  let html = "";
  todas.forEach(k=>{
    const dim = (k==="awm"||k==="camara") ? " dim" : "";
    html += `<div class="row${dim}"><span>${etiquetas[k]}</span><span>${resultado[k]}</span></div>`;
  });
  $("configOutput").innerHTML = html;
  $("notasOutput").innerHTML = notas.map(n=>`<div>• ${n}</div>`).join("");

  const fecha = new Date().toLocaleString("es-AR");
  let lineas = [];
  lineas.push("CONFIGURACIÓN DE SENSIBILIDAD - FREE FIRE");
  lineas.push("=".repeat(45));
  lineas.push(`Generado: ${fecha}`);
  lineas.push(`Dispositivo: ${nombre}`);
  lineas.push(`Situación: ${nombreSituacion(situacion)}`);
  lineas.push(`DPI usado para el cálculo: ${dpi}`);
  if (boton) lineas.push(`Botón de disparo: ${boton}`);
  lineas.push("");
  lineas.push("--- CONFIGURACIÓN LISTA ---");
  todas.forEach(k=> lineas.push(`${etiquetas[k]}: ${resultado[k]}`));
  lineas.push("");
  lineas.push("--- NOTAS ---");
  notas.forEach(n=> lineas.push(`- ${n}`));
  lineas.push("");
  lineas.push("Probá 10-15 min en entrenamiento antes de ranked.");

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
  a.download = `config_${nombre}.txt`;
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
