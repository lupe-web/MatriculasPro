/* ============ VARIABLES Y TIPOS DE DATOS ============ */
const CLAVE = "matriculaPro_v1";                           // string
let db = { estudiantes: [], cursos: [], matriculas: [] }; // objeto con arreglos
let ultimoRespaldo = null;                                 // null (sin valor aún)
const EDAD_MINIMA = 15;                                    // number
let confirmando = null;                                    // clave temporal para eliminar

const $ = id => document.getElementById(id);

/* ============ SALIDA DE INFORMACIÓN ============ */
function aviso(msg){
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}
function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

/* ============ PERSISTENCIA ============ */
function guardar(){
  try { localStorage.setItem(CLAVE, JSON.stringify(db)); } catch(e) {}
}
function cargar(){
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) db = JSON.parse(raw);
  } catch(e) {}
  // Condicional: datos de ejemplo si está vacío
  if (db.estudiantes.length === 0 && db.cursos.length === 0) {
    db.estudiantes.push({id:"001", nombre:"Ana Martínez", email:"ana@mail.com", edad:19, carrera:"Ingeniería"});
    db.cursos.push({cod:"MAT101", nombre:"Matemática I", docente:"Lic. Pérez", creditos:4, cupo:30});
    guardar();
  }
}

/* ============ NAVEGACIÓN ============ */
function ir(sec){
  document.querySelectorAll("section").forEach(s => s.classList.toggle("on", s.id === sec));
  document.querySelectorAll("#menu button").forEach(b => b.classList.toggle("on", b.dataset.s === sec));
  refrescar();
  window.scrollTo(0, 0);
}
$("menu").addEventListener("click", e => { if (e.target.dataset.s) ir(e.target.dataset.s); });

/* ============ ELIMINAR CON CONFIRMACIÓN (2 clics) ============ */
function pedirEliminar(clave, accion, btn){
  if (confirmando === clave) {
    confirmando = null;
    accion();
  } else {
    confirmando = clave;
    btn.textContent = "¿Seguro?";
    setTimeout(() => { confirmando = null; refrescar(); }, 3000);
  }
}

/* ============ ESTUDIANTES (CRUD) ============ */
$("eGuardar").onclick = function(){
  // ENTRADA DE DATOS
  const id = $("eId").value.trim();
  const nombre = $("eNom").value.trim();
  const email = $("eMail").value.trim();
  const edad = parseInt($("eEdad").value);
  const carrera = $("eCar").value;
  const editando = $("eEdit").value;

  // CONDICIONALES / validación
  if (!id || !nombre || !email) return aviso("⚠️ Completa todos los campos");
  if (!email.includes("@")) return aviso("⚠️ Correo inválido");
  if (isNaN(edad) || edad < EDAD_MINIMA) return aviso("⚠️ La edad mínima es " + EDAD_MINIMA);
  if (db.estudiantes.some(e => e.id === id && e.id !== editando)) return aviso("⚠️ Ya existe ese documento");

  const reg = { id, nombre, email, edad, carrera };
  if (editando) {                                     // MODIFICAR
    const i = db.estudiantes.findIndex(e => e.id === editando);
    db.estudiantes[i] = reg;
    db.matriculas.forEach(m => { if (m.est === editando) m.est = id; });
    aviso("✏️ Estudiante actualizado");
  } else {                                            // CREAR
    db.estudiantes.push(reg);
    aviso("✅ Estudiante registrado");
  }
  guardar(); limpiarEst(); refrescar();
};

function limpiarEst(){
  ["eId","eNom","eMail","eEdad","eEdit"].forEach(i => $(i).value = "");
  $("tEst").textContent = "Nuevo estudiante";
}
$("eCancel").onclick = limpiarEst;

function editarEst(id){
  const e = db.estudiantes.find(x => x.id === id);
  $("eEdit").value = e.id;
  $("eId").value = e.id;
  $("eNom").value = e.nombre;
  $("eMail").value = e.email;
  $("eEdad").value = e.edad;
  $("eCar").value = e.carrera;
  $("tEst").textContent = "Modificar estudiante";
}

function borrarEst(id){                               // ELIMINAR
  db.estudiantes = db.estudiantes.filter(e => e.id !== id);
  db.matriculas = db.matriculas.filter(m => m.est !== id);
  guardar(); aviso("🗑️ Estudiante eliminado"); refrescar();
}

function tablaEstudiantes(){                          // CONSULTAR
  const q = $("eBuscar").value.toLowerCase();
  const lista = db.estudiantes.filter(e => (e.id + e.nombre + e.carrera).toLowerCase().includes(q));
  if (lista.length === 0) { $("tablaEst").innerHTML = '<div class="empty">Sin resultados</div>'; return; }

  let h = "<table><tr><th>Doc.</th><th>Nombre</th><th>Edad</th><th>Carrera</th><th></th></tr>";
  for (const e of lista) {                            // CICLO for...of
    h += `<tr>
      <td>${esc(e.id)}</td>
      <td>${esc(e.nombre)}<br><small style="color:var(--mut)">${esc(e.email)}</small></td>
      <td>${e.edad}</td>
      <td><span class="tag">${esc(e.carrera)}</span></td>
      <td>
        <button class="btn sm sec" data-a="ee" data-k="${esc(e.id)}">Editar</button>
        <button class="btn sm bad" data-a="de" data-k="${esc(e.id)}">${confirmando === "e"+e.id ? "¿Seguro?" : "Eliminar"}</button>
      </td></tr>`;
  }
  $("tablaEst").innerHTML = h + "</table>";
}
$("eBuscar").oninput = tablaEstudiantes;

/* ============ CURSOS (CRUD) ============ */
function ocupados(cod){ return db.matriculas.filter(m => m.cur === cod).length; }

$("cGuardar").onclick = function(){
  const cod = $("cCod").value.trim().toUpperCase();
  const nombre = $("cNom").value.trim();
  const docente = $("cDoc").value.trim();
  const creditos = Number($("cCre").value);
  const cupo = Number($("cCupo").value);
  const editando = $("cEdit").value;

  if (!cod || !nombre || !docente) return aviso("⚠️ Completa todos los campos");
  if (creditos < 1 || creditos > 10) return aviso("⚠️ Créditos entre 1 y 10");
  if (cupo < 1) return aviso("⚠️ El cupo debe ser mayor a 0");
  if (editando && cupo < ocupados(editando)) return aviso("⚠️ El cupo no puede ser menor a los matriculados");
  if (db.cursos.some(c => c.cod === cod && c.cod !== editando)) return aviso("⚠️ Código ya existe");

  const reg = { cod, nombre, docente, creditos, cupo };
  if (editando) {
    db.cursos[db.cursos.findIndex(c => c.cod === editando)] = reg;
    db.matriculas.forEach(m => { if (m.cur === editando) m.cur = cod; });
    aviso("✏️ Curso actualizado");
  } else {
    db.cursos.push(reg);
    aviso("✅ Curso registrado");
  }
  guardar(); limpiarCur(); refrescar();
};

function limpiarCur(){
  ["cCod","cNom","cDoc","cEdit"].forEach(i => $(i).value = "");
  $("cCre").value = 3;
  $("cCupo").value = 30;
  $("tCur").textContent = "Nuevo curso";
}
$("cCancel").onclick = limpiarCur;

function editarCur(cod){
  const c = db.cursos.find(x => x.cod === cod);
  $("cEdit").value = c.cod;
  $("cCod").value = c.cod;
  $("cNom").value = c.nombre;
  $("cDoc").value = c.docente;
  $("cCre").value = c.creditos;
  $("cCupo").value = c.cupo;
  $("tCur").textContent = "Modificar curso";
}

function borrarCur(cod){
  db.cursos = db.cursos.filter(c => c.cod !== cod);
  db.matriculas = db.matriculas.filter(m => m.cur !== cod);
  guardar(); aviso("🗑️ Curso eliminado"); refrescar();
}

function tablaCursos(){
  const q = $("cBuscar").value.toLowerCase();
  const lista = db.cursos.filter(c => (c.cod + c.nombre + c.docente).toLowerCase().includes(q));
  if (!lista.length) { $("tablaCur").innerHTML = '<div class="empty">Sin resultados</div>'; return; }

  let h = "<table><tr><th>Código</th><th>Curso</th><th>Docente</th><th>Créd.</th><th>Cupo</th><th></th></tr>";
  for (let i = 0; i < lista.length; i++) {            // CICLO for clásico
    const c = lista[i];
    const usados = ocupados(c.cod);
    const estado = usados >= c.cupo ? "color:var(--bad)" : "color:var(--ok)";   // ternario
    h += `<tr>
      <td><b>${esc(c.cod)}</b></td><td>${esc(c.nombre)}</td><td>${esc(c.docente)}</td>
      <td>${c.creditos}</td><td style="${estado}">${usados}/${c.cupo}</td>
      <td>
        <button class="btn sm sec" data-a="ec" data-k="${esc(c.cod)}">Editar</button>
        <button class="btn sm bad" data-a="dc" data-k="${esc(c.cod)}">${confirmando === "c"+c.cod ? "¿Seguro?" : "Eliminar"}</button>
      </td></tr>`;
  }
  $("tablaCur").innerHTML = h + "</table>";
}
$("cBuscar").oninput = tablaCursos;

/* ============ MATRÍCULAS ============ */
$("mGuardar").onclick = function(){
  const est = $("mEst").value;
  const cur = $("mCur").value;
  if (!est || !cur) return aviso("⚠️ Registra estudiantes y cursos primero");

  const c = db.cursos.find(x => x.cod === cur);
  if (db.matriculas.some(m => m.est === est && m.cur === cur)) return aviso("⚠️ Ya está matriculado en ese curso");
  if (ocupados(cur) >= c.cupo) return aviso("⛔ Curso sin cupo disponible");

  db.matriculas.push({ est, cur, fecha: new Date().toLocaleDateString("es-SV") });
  guardar(); aviso("✅ Matrícula realizada"); refrescar();
};

function filaMatriculas(lista, conBoton){
  let h = "<table><tr><th>Estudiante</th><th>Curso</th><th>Fecha</th>" + (conBoton ? "<th></th>" : "") + "</tr>";
  lista.forEach(m => {
    const e = db.estudiantes.find(x => x.id === m.est);
    const c = db.cursos.find(x => x.cod === m.cur);
    h += `<tr>
      <td>${esc(e ? e.nombre : "?")}</td>
      <td>${esc(c ? c.cod + " · " + c.nombre : "?")}</td>
      <td>${m.fecha}</td>`;
    if (conBoton) {
      h += `<td><button class="btn sm bad" data-a="dm" data-k="${esc(m.est)}|${esc(m.cur)}">${confirmando === "m"+m.est+m.cur ? "¿Seguro?" : "Anular"}</button></td>`;
    }
    h += "</tr>";
  });
  return h + "</table>";
}
function tablaMatriculas(){
  $("tablaMat").innerHTML = db.matriculas.length
    ? filaMatriculas(db.matriculas, true)
    : '<div class="empty">Aún no hay matrículas</div>';
}

/* ============ BOTONES DE LAS TABLAS (delegación de eventos) ============ */
document.addEventListener("click", e => {
  const b = e.target.closest("button[data-a]");
  if (!b) return;
  const k = b.dataset.k;

  switch (b.dataset.a) {                              // estructura switch
    case "ee": editarEst(k); break;
    case "ec": editarCur(k); break;
    case "de": pedirEliminar("e" + k, () => borrarEst(k), b); break;
    case "dc": pedirEliminar("c" + k, () => borrarCur(k), b); break;
    case "dm": {
      const [s, c] = k.split("|");
      pedirEliminar("m" + s + c, () => {
        db.matriculas = db.matriculas.filter(m => !(m.est === s && m.cur === c));
        guardar(); aviso("🗑️ Matrícula anulada"); refrescar();
      }, b);
    }
  }
});

/* ============ RESPALDO ============ */
$("bkGen").onclick = function(){
  ultimoRespaldo = { fecha: new Date().toISOString(), datos: db };
  $("bkTxt").value = JSON.stringify(ultimoRespaldo, null, 2);
  $("bkInfo").textContent = "Respaldo generado el " + new Date().toLocaleString("es-SV") + " · " +
    db.estudiantes.length + " estudiantes, " + db.cursos.length + " cursos, " + db.matriculas.length + " matrículas.";
  aviso("💾 Respaldo generado");
};

$("bkCopy").onclick = function(){
  const t = $("bkTxt");
  if (!t.value) return aviso("⚠️ Genera el respaldo primero");
  t.select();
  try {
    navigator.clipboard.writeText(t.value).then(() => aviso("📋 Copiado")).catch(() => document.execCommand("copy"));
  } catch(e) {
    document.execCommand("copy");
    aviso("📋 Copiado");
  }
};

$("bkRes").onclick = function(){
  try {
    const obj = JSON.parse($("bkTxt").value);
    const d = obj.datos || obj;
    if (!Array.isArray(d.estudiantes) || !Array.isArray(d.cursos) || !Array.isArray(d.matriculas)) throw new Error("formato");
    db = d; guardar(); refrescar(); aviso("♻️ Información restaurada");
  } catch(e) { aviso("⛔ Respaldo inválido"); }
};

$("bkDel").onclick = function(){
  pedirEliminar("todo", () => {
    db = { estudiantes: [], cursos: [], matriculas: [] };
    guardar(); aviso("🗑️ Datos borrados"); refrescar();
  }, this);
};

/* ============ INICIO: estadísticas ============ */
function inicio(){
  let creditos = 0;
  for (const c of db.cursos) creditos += c.creditos;  // acumulador con operador +=

  const prom = db.estudiantes.length
    ? (db.estudiantes.reduce((a, e) => a + e.edad, 0) / db.estudiantes.length).toFixed(1)
    : 0;

  const datos = [
    ["Estudiantes", db.estudiantes.length],
    ["Cursos", db.cursos.length],
    ["Matrículas", db.matriculas.length],
    ["Edad promedio", prom]
  ];
  $("stats").innerHTML = datos.map(([n, v]) => `<div class="card stat"><b>${v}</b><span>${n}</span></div>`).join("");

  const ult = db.matriculas.slice(-5).reverse();
  $("ultimas").innerHTML = ult.length
    ? filaMatriculas(ult, false)
    : '<div class="empty">Aún no hay matrículas</div>';
}

/* ============ REFRESCAR TODA LA INTERFAZ ============ */
function refrescar(){
  $("mEst").innerHTML = db.estudiantes.map(e => `<option value="${esc(e.id)}">${esc(e.nombre)} (${esc(e.id)})</option>`).join("");
  $("mCur").innerHTML = db.cursos.map(c => `<option value="${esc(c.cod)}">${esc(c.cod)} · ${esc(c.nombre)} (${ocupados(c.cod)}/${c.cupo})</option>`).join("");
  tablaEstudiantes();
  tablaCursos();
  tablaMatriculas();
  inicio();
}

/* ============ INICIO DE LA APLICACIÓN ============ */
cargar();
refrescar();