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

// --- CALIBRADOR DE SENSIBILIDAD ---
const REQUERIDOS = ["general","punto_rojo","x2","x4"];
const todas = ["general","punto_rojo","x2","x4","awm","camara"];

$("gama").addEventListener("change", ()=>{
  $("dpiManual").classList.toggle("hidden", $("gama").value !== "custom");
});

// Devuelve la frecuencia de muestreo tactil (Hz) del modelo elegido,
// o el valor manual si el usuario cargo uno propio.
function obtenerHzTactil(){
  if ($("gama").value === "custom"){
    return Math.min(1000, Math.max(60, Number($("dpiManual").value) || 240));
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
  Cada mira recibe un factor distinto segun que tan relevante es
  para el problema reportado (no es el mismo % para las 4):

  - "La mira no sube": problema sobre todo de corta/media distancia,
    donde mas pesa Punto rojo y General.
  - "Se pasa de la cabeza": exceso de sensibilidad, mas notorio de
    cerca -> se baja mas fuerte Punto rojo/General.
  - "Giros rapidos 360": depende casi solo de General (no se gira
    con la mira puesta).
  - "Pierdo consistencia": no es un problema de velocidad sino de
    variacion -> ajuste minimo, el objetivo es practica guiada.
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

// Frecuencia tactil de referencia: la de un gama media tipico (A54 = 240Hz,
// dato verificado). Celulares mas rapidos detectan el dedo mas seguido,
// por eso necesitan un poco MENOS de sensibilidad para el mismo movimiento;
// los mas lentos necesitan un poco MAS para compensar el "salto" entre lecturas.
const HZ_BASE = 240;

function calcular(situacion, hzTactil, valores){
  const tabla = TABLA_AJUSTE[situacion];

  let factorTactil = 1 - 0.25 * ((hzTactil - HZ_BASE) / HZ_BASE);
  factorTactil = Math.min(Math.max(factorTactil, 0.75), 1.35);

  const resultado = {...valores};
  REQUERIDOS.forEach(k=>{
    const factorMira = tabla[k];
    let v = valores[k] * factorMira * factorTactil;
    resultado[k] = Math.round(Math.min(Math.max(v,0),200));
  });

  const notaTactil = hzTactil > HZ_BASE
    ? `Tu celular detecta el dedo más seguido que el promedio (${hzTactil} Hz vs ${HZ_BASE} Hz de referencia): se compensó bajando un poco la sensibilidad, porque ya de por sí responde más rápido.`
    : (hzTactil < HZ_BASE
        ? `Tu celular detecta el dedo menos seguido que el promedio (${hzTactil} Hz vs ${HZ_BASE} Hz de referencia): se compensó subiendo un poco la sensibilidad, para que el movimiento no se sienta "a saltos".`
        : `Frecuencia táctil en el valor de referencia (${HZ_BASE} Hz): sin ajuste adicional por este factor.`);

  return {
    resultado,
    notas: [tabla.nota, notaTactil, "AWM/Sniper y Cámara (free look) se dejaron SIN modificar."]
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
  const hzTactil = obtenerHzTactil();
  const boton = $("boton").value.trim();

  const valores = {};
  todas.forEach(k=>{
    const raw = $("n_"+k).value.trim();
    valores[k] = raw === "" ? 0 : Number(raw);
  });

  const { resultado, notas } = calcular(situacion, hzTactil, valores);

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
  lineas.push("CALIBRACIÓN DE SENSIBILIDAD - FREE FIRE");
  lineas.push("=".repeat(45));
  lineas.push(`Generado: ${fecha}`);
  lineas.push(`Dispositivo: ${nombre}`);
  lineas.push(`Situación: ${nombreSituacion(situacion)}`);
  lineas.push(`Frecuencia táctil usada para el cálculo: ${hzTactil} Hz`);
  if (boton) lineas.push(`Botón de disparo: ${boton}`);
  lineas.push("");
  lineas.push("--- CALIBRACIÓN LISTA ---");
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
