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
const REQUERIDOS = ["general","punto_rojo","x2","x4"];
const todas = ["general","punto_rojo","x2","x4","awm","camara"];

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

/*
  TABLA DE AJUSTE POR MIRA Y POR PROBLEMA
  ----------------------------------------
  A diferencia de una version anterior que aplicaba el mismo
  porcentaje a las 4 miras por igual, esto reparte el ajuste
  segun que tan relevante es cada mira para el problema reportado:

  - "La mira no sube" es sobre todo un problema de corta/media
    distancia -> Punto rojo y General son los mas responsables
    del arrastre rapido, se corrigen mas fuerte. Mira 4x casi
    no interviene en ese problema, se toca poco.
  - "Se pasa de la cabeza" (demasiado sensible) es tambien mas
    notorio de cerca -> se baja mas Punto rojo/General, y menos
    las miras largas (ya son mas lentas de por si).
  - "Giros rapidos 360" depende casi enteramente de General
    (no se gira con la mira puesta) -> se sube fuerte General,
    poco el resto, nada la Mira 4x.
  - "Pierdo consistencia" no es un problema de velocidad sino de
    variacion -> ajuste minimo y parejo, el objetivo es practica
    guiada, no un cambio grande de sensibilidad.
*/
const TABLA_AJUSTE = {
  no_sube:      { general: 1.18, punto_rojo: 1.22, x2: 1.10, x4: 1.04,
                  nota: "El problema es sobre todo de corta/media distancia: se reforzó más Punto rojo y General (lo que más pesa al levantar la mira), y casi no se tocó Mira 4x." },
  se_pasa:      { general: 0.88, punto_rojo: 0.83, x2: 0.90, x4: 0.93,
                  nota: "Se bajó más Punto rojo y General (donde el exceso de sensibilidad se nota primero en corta distancia), y menos las miras largas." },
  giros:        { general: 1.25, punto_rojo: 1.06, x2: 1.02, x4: 1.00,
                  nota: "Los giros de 360° dependen casi solo de la sensibilidad General; por eso se subió fuerte ahí y casi no se tocaron las miras (no se gira mirando por el visor)." },
  consistencia: { general: 1.03, punto_rojo: 1.03, x2: 1.02, x4: 1.02,
                  nota: "No es un problema de velocidad sino de variación: el ajuste es mínimo y parejo, porque acá lo que más ayuda es practicar 10-15 min con el mismo valor fijo, no cambiar mucho la sensibilidad." },
};

function calcular(situacion, dpi, valores){
  const tabla = TABLA_AJUSTE[situacion];

  const dpiBase = 411;
  let factorDpi = 1 - 0.3 * ((dpi - dpiBase) / dpiBase);
  factorDpi = Math.min(Math.max(factorDpi, 0.7), 1.3);

  const resultado = {...valores};
  const detalle = {};
  REQUERIDOS.forEach(k=>{
    const factorMira = tabla[k];
    let v = valores[k] * factorMira * factorDpi;
    v = Math.round(Math.min(Math.max(v,0),200));
    resultado[k] = v;
    detalle[k] = { antes: valores[k], despues: v, factorMira, factorDpi };
  });

  const notaDpi = dpi > dpiBase
    ? "DPI del sistema por encima del valor de fábrica: se compensó bajando un poco la sensibilidad del juego (el táctil ya responde más rápido)."
    : (dpi < dpiBase ? "DPI del sistema por debajo del valor de fábrica: se compensó subiendo un poco la sensibilidad del juego (el táctil responde más lento)." : "DPI en valor de fábrica: sin ajuste adicional por DPI.");

  return {
    resultado,
    detalle,
    notas: [tabla.nota, notaDpi, "AWM/Sniper y Cámara (free look) se dejaron SIN modificar."]
  };
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
actualizarVisibilidadBoton(); // estado inicial: boton oculto, aviso visible

$("btnGenerar").addEventListener("click", ()=>{
  if (!datosCompletos()) return;

  const nombre = $("nombre").value.trim() || "Dispositivo sin nombre";
  const situacion = document.querySelector('input[name="sit"]:checked').value;
  const dpi = obtenerDpi();
  const boton = $("boton").value.trim();

  const valores = {};
  todas.forEach(k=>{
    const raw = $("n_"+k).value.trim();
    valores[k] = raw === "" ? 0 : Number(raw);
  });

  const { resultado, notas } = calcular(situacion, dpi, valores);

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
  todas.forEach(k=>{
    const valorMostrado = (k==="awm"||k==="camara") ? (valores[k] || "sin cambios") : resultado[k];
    lineas.push(`${etiquetas[k]}: ${valorMostrado}`);
  });
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
