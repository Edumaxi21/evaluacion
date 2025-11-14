let preguntas = [];
let preguntasPorNivel = { facil: [], medio: [], dificil: [] };

let nivelActual = "";
let tiempo = 15;
let temporizadorEntrenamiento;
let temporizadorExamen;
let temporizadorSup;

let puntajeEntrenamiento = 0;

// EXAMEN
let examenPreguntas = [];
let examenIndex = 0;
let puntajeExamen = 0;

// SUPERVIVENCIA
let rachaSup = 0;
let preguntaActualSup = null;

// HISTORIAL
let historial = JSON.parse(localStorage.getItem("historialGRE")) || [];

// ---------------- CARGA DE PREGUNTAS DESDE JSON -----------------

document.addEventListener("DOMContentLoaded", () => {
  fetch('data/preguntas.json')
    .then(res => res.json())
    .then(data => {
      preguntas = data;
      clasificarPorNivel();
      document.getElementById("cargando").style.display = "none";
      document.getElementById("menuPrincipal").style.display = "block";
    })
    .catch(err => {
      document.getElementById("cargando").innerText = "Error cargando preguntas: " + err;
    });
});

function clasificarPorNivel() {
  preguntasPorNivel = { facil: [], medio: [], dificil: [] };
  preguntas.forEach(p => {
    if (preguntasPorNivel[p.nivel]) {
      preguntasPorNivel[p.nivel].push(p);
    }
  });
}

// ---------------- MENÚS -----------------

function seleccionarNivel() {
  ocultarTodo();
  document.getElementById("seleccionNivel").style.display = "block";
}

function volverMenu() {
  limpiarTimers();
  ocultarTodo();
  document.getElementById("menuPrincipal").style.display = "block";
}

function ocultarTodo() {
  document.getElementById("seleccionNivel").style.display = "none";
  document.getElementById("juego").style.display = "none";
  document.getElementById("examen").style.display = "none";
  document.getElementById("supervivencia").style.display = "none";
  document.getElementById("historial").style.display = "none";
}

function limpiarTimers() {
  clearInterval(temporizadorEntrenamiento);
  clearInterval(temporizadorExamen);
  clearInterval(temporizadorSup);
}

// ---------------- MODO ENTRENAMIENTO -----------------

function iniciar(nivel) {
  nivelActual = nivel;
  puntajeEntrenamiento = 0;
  document.getElementById("seleccionNivel").style.display = "none";
  document.getElementById("juego").style.display = "block";
  document.getElementById("puntaje").innerText = "Puntaje: 0";
  siguientePregunta();
}

function siguientePregunta() {
  clearInterval(temporizadorEntrenamiento);

  tiempo = nivelActual === "dificil" ? 10 : nivelActual === "medio" ? 12 : 15;
  document.getElementById("temporizador").innerText = "Tiempo: " + tiempo;

  temporizadorEntrenamiento = setInterval(() => {
    tiempo--;
    document.getElementById("temporizador").innerText = "Tiempo: " + tiempo;
    if (tiempo <= 0) {
      clearInterval(temporizadorEntrenamiento);
      generarPreguntaEntrenamiento();
    }
  }, 1000);

  generarPreguntaEntrenamiento();
}

function generarPreguntaEntrenamiento() {
  const lista = preguntasPorNivel[nivelActual];
  if (!lista || lista.length === 0) {
    document.getElementById("pregunta").innerText = "No hay preguntas para este nivel.";
    document.getElementById("opciones").innerHTML = "";
    return;
  }

  const q = lista[Math.floor(Math.random() * lista.length)];
  mostrarPreguntaConOpciones(q, "pregunta", "opciones", (correcta) => {
    if (correcta) {
      puntajeEntrenamiento++;
      document.getElementById("puntaje").innerText = "Puntaje: " + puntajeEntrenamiento;
    }
  });
}

// ---------------- MODO EXAMEN -----------------

function iniciarExamen() {
  if (preguntas.length === 0) return;

  ocultarTodo();
  document.getElementById("examen").style.display = "block";

  examenPreguntas = [...preguntas];
  examenPreguntas.sort(() => Math.random() - 0.5);
  examenPreguntas = examenPreguntas.slice(0, 20);

  examenIndex = 0;
  puntajeExamen = 0;
  document.getElementById("puntajeEx").innerText = "Puntaje: 0 / 20";

  siguienteExamen();
}

function siguienteExamen() {
  clearInterval(temporizadorExamen);

  tiempo = 15;
  document.getElementById("temporizadorEx").innerText = "Tiempo: " + tiempo;

  temporizadorExamen = setInterval(() => {
    tiempo--;
    document.getElementById("temporizadorEx").innerText = "Tiempo: " + tiempo;
    if (tiempo <= 0) {
      clearInterval(temporizadorExamen);
      avanzarExamen();
    }
  }, 1000);

  avanzarExamen();
}

function avanzarExamen() {
  if (examenIndex >= examenPreguntas.length) {
    finalizarExamen();
    return;
  }

  const q = examenPreguntas[examenIndex];
  document.getElementById("contadorEx").innerText = "Pregunta " + (examenIndex + 1) + " de " + examenPreguntas.length;

  mostrarPreguntaConOpciones(q, "preguntaEx", "opcionesEx", (correcta) => {
    if (correcta) {
      puntajeExamen++;
      document.getElementById("puntajeEx").innerText = "Puntaje: " + puntajeExamen + " / " + examenPreguntas.length;
    }
  });

  examenIndex++;
}

function finalizarExamen() {
  limpiarTimers();
  const fecha = new Date().toLocaleString();
  historial.push({ fecha, puntaje: puntajeExamen, total: examenPreguntas.length });
  localStorage.setItem("historialGRE", JSON.stringify(historial));

  document.getElementById("examen").innerHTML =
    `<h2>Examen finalizado</h2>
     <p>Puntaje obtenido: ${puntajeExamen} / ${examenPreguntas.length}</p>
     <button onclick="location.reload()">Reiniciar</button>`;
}

// ---------------- MODO SUPERVIVENCIA -----------------

function iniciarSupervivencia() {
  ocultarTodo();
  document.getElementById("supervivencia").style.display = "block";
  rachaSup = 0;
  document.getElementById("rachaSup").innerText = "Racha: 0 respuestas correctas seguidas";
  siguientePreguntaSupervivencia();
}

function siguientePreguntaSupervivencia() {
  clearInterval(temporizadorSup);
  tiempo = 15;
  document.getElementById("temporizadorSup").innerText = "Tiempo: " + tiempo;

  temporizadorSup = setInterval(() => {
    tiempo--;
    document.getElementById("temporizadorSup").innerText = "Tiempo: " + tiempo;
    if (tiempo <= 0) {
      clearInterval(temporizadorSup);
      gameOverSupervivencia("Se acabó el tiempo");
    }
  }, 1000);

  if (preguntas.length === 0) return;
  preguntaActualSup = preguntas[Math.floor(Math.random() * preguntas.length)];

  mostrarPreguntaConOpciones(preguntaActualSup, "preguntaSup", "opcionesSup", (correcta) => {
    if (correcta) {
      rachaSup++;
      document.getElementById("rachaSup").innerText = "Racha: " + rachaSup + " respuestas correctas seguidas";
      siguientePreguntaSupervivencia();
    } else {
      gameOverSupervivencia("Respuesta incorrecta");
    }
  });
}

function gameOverSupervivencia(motivo) {
  limpiarTimers();
  document.getElementById("preguntaSup").innerText =
    motivo + ". Juego terminado. Racha final: " + rachaSup;
  document.getElementById("opcionesSup").innerHTML = "";
}

// ---------------- HISTORIAL -----------------

function mostrarHistorial() {
  ocultarTodo();
  document.getElementById("historial").style.display = "block";
  const box = document.getElementById("historialBox");
  box.innerHTML = "";

  if (historial.length === 0) {
    box.innerHTML = "<p>No hay exámenes registrados todavía.</p>";
    return;
  }

  historial.forEach(h => {
    box.innerHTML += `<p><strong>${h.fecha}</strong> — Puntaje: ${h.puntaje} / ${h.total}</p>`;
  });
}

// ---------------- FUNCIÓN GENERAL PARA MOSTRAR PREGUNTA -----------------

function mostrarPreguntaConOpciones(q, idPregunta, idOpciones, callbackResultado) {
  const pElem = document.getElementById(idPregunta);
  const cont = document.getElementById(idOpciones);

  pElem.innerText = q.pregunta;
  cont.innerHTML = "";

  const opciones = [...q.opciones];
  opciones.sort(() => Math.random() - 0.5);

  let yaRespondio = false;

  opciones.forEach(op => {
    const div = document.createElement("div");
    div.className = "opcion";
    div.innerText = op;
    div.onclick = () => {
      if (yaRespondio) return;
      yaRespondio = true;

      const correcta = (op === q.correcta);
      if (correcta) {
        div.classList.add("correcta");
      } else {
        div.classList.add("incorrecta");
        // marcar también la correcta
        [...cont.children].forEach(c => {
          if (c.innerText === q.correcta) c.classList.add("correcta");
        });
      }

      if (typeof callbackResultado === "function") {
        callbackResultado(correcta);
      }
    };
    cont.appendChild(div);
  });
}

function mostrarSelectorModulo() {
  ocultarTodo();
  document.getElementById("selectorModulo").style.display = "block";
}

function iniciarModulo() {
  const modulo = document.getElementById("moduloElegido").value;

  if (modulo === "todos") {
    preguntasFiltradas = [...preguntas];
  } else {
    preguntasFiltradas = preguntas.filter(p => p.modulo === modulo);
  }

  if (preguntasFiltradas.length === 0) {
    alert("Este módulo no tiene preguntas cargadas aún.");
    return;
  }

  nivelActual = "modulo";
  preguntaIndex = 0;
  puntajeEntrenamiento = 0;

  ocultarTodo();
  document.getElementById("juego").style.display = "block";
  siguientePreguntaModulo();
}

function siguientePreguntaModulo() {
  clearInterval(temporizadorEntrenamiento);

  tiempo = 15;
  document.getElementById("temporizador").innerText = "Tiempo: " + tiempo;

  temporizadorEntrenamiento = setInterval(() => {
    tiempo--;
    document.getElementById("temporizador").innerText = "Tiempo: " + tiempo;
    if (tiempo <= 0) {
      clearInterval(temporizadorEntrenamiento);
      preguntaIndex++;
      if (preguntaIndex >= preguntasFiltradas.length) {
        alert("Fin del módulo.");
        volverMenu();
        return;
      }
      mostrarPreguntaModulo();
    }
  }, 1000);

  mostrarPreguntaModulo();
}

function mostrarPreguntaModulo() {
  const q = preguntasFiltradas[preguntaIndex];
  mostrarPreguntaConOpciones(q, "pregunta", "opciones", (correcta) => {
    if (correcta) {
      puntajeEntrenamiento++;
      document.getElementById("puntaje").innerText = "Puntaje: " + puntajeEntrenamiento;
    }
    preguntaIndex++;
    if (preguntaIndex >= preguntasFiltradas.length) {
      setTimeout(() => {
        alert("¡Terminaste este módulo!");
        volverMenu();
      }, 600);
    }
  });
}


