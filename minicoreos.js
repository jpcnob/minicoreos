// minicoreos.js
import { pasosDeBaile } from './pasosDeBaile.js';

const coreografiasGeneradas = [];
let indiceCoreografia = 0;
let pasosSeleccionados = [];
var favoritos = {
  carpetas: {}
};


let combinacionesLimite = 300000; // Establecer el límite de combinaciones
let combinacionesGeneradas = 0; // Variable para contar las combinaciones generadas

//Generar todas las combinaciones 
function generarCombinacionesDuracion(pasos, duracionRestante, pasoInicio = null, inicio = 0, combinacionActual = [], ultimoFin = null, ultimoFrente = null, mismoFrente = false, profundidad = 0, profundidadMaxima = 16) {
  let combinaciones = [];
  let sumaActual = combinacionActual.reduce((suma, paso) => suma + paso.duracion, 0);
  

  if (sumaActual === duracionRestante) {
    combinaciones.push(combinacionActual);
    combinacionesGeneradas++;
  }

  if (sumaActual < duracionRestante && profundidad < profundidadMaxima && combinacionesGeneradas < combinacionesLimite) {
    for (let i = 0; i < pasos.length; i++) {
      // Si estamos en el primer paso y el paso actual no es el paso de inicio, continuamos
      if (profundidad == 0 && pasoInicio && pasos[i].nombre !== pasoInicio) {
        continue;
      }

      // Evitar la repetición de pasos en la misma combinación
      if (combinacionActual.find(paso => paso.nombre === pasos[i].nombre)) {
        continue;
      }

      // Asegurarse de que el inicio del paso actual es compatible con el fin del último paso agregado
      let inicioActual = Array.isArray(pasos[i].inicio) ? pasos[i].inicio : [pasos[i].inicio];
      if (ultimoFin !== null && !inicioActual.includes(ultimoFin)) {
        continue;
      }

      // Verificar compatibilidad de 'mismoFrente'
      let frenteNuevo = pasos[i].mismoFrente === true ? ultimoFrente : (ultimoFrente === 'izquierda-derecha' ? 'derecha-izquierda' : 'izquierda-derecha');

      // Verificar compatibilidad de 'frente'
      let frentesActuales = Array.isArray(pasos[i].frente) ? pasos[i].frente : [pasos[i].frente];

      if (ultimoFrente !== null && !frentesActuales.includes(frenteNuevo)) {
          continue;
      }

      // Comprobar compatibilidad de 'rotacion'
      if (combinacionActual.length > 0 && combinacionActual[combinacionActual.length - 1].hasOwnProperty('rotacionFin')) {
        if (pasos[i].hasOwnProperty('rotacionInicio')) {
            // Si ambos pasos tienen definida la rotación, deben coincidir
            if (pasos[i].rotacionInicio !== combinacionActual[combinacionActual.length - 1].rotacionFin) {
                continue;
            }
        } 
    }
    
      // Seleccionar una posición final compatible
      let finActual = Array.isArray(pasos[i].fin) ? pasos[i].fin : [pasos[i].fin];
      let finCompatible = finActual.find(fin => inicioActual.includes(fin)) || finActual[0];

      combinaciones = [
        ...combinaciones,
        ...generarCombinacionesDuracion(pasos, duracionRestante, pasoInicio, i + 1, [...combinacionActual, pasos[i]], finCompatible, frenteNuevo, pasos[i].mismoFrente, profundidad + 1, profundidadMaxima)
      ];
      
   
    }
  }

  return combinaciones;
}

let combinacionesCache = {};
let ultimaDuracionTotal = null;
let ultimosPasosAgregados = [];
//Funcion generar coreografía con los pasos agregados 
function generarCoreografia() {

combinacionesGeneradas = 0; // Restablece combinacionesGeneradas a 0

// Recoger los datos de entrada de la interfaz de usuario
const iniciales = Array.from(document.getElementById("iniciales").querySelectorAll(".paso")).map(el => el.innerText);
const medios = Array.from(document.getElementById("medios").querySelectorAll(".paso")).map(el => el.innerText);
const finales = Array.from(document.getElementById("finales").querySelectorAll(".paso")).map(el => el.innerText);
const duracionTotalSelect = document.getElementById("duracionTotal");
const duracionTotalPersonalizada = document.getElementById("duracionTotalPersonalizada");

const pasosIniciales = pasosDeBaile.filter((paso) => iniciales.includes(paso.nombre));
const pasosMedios = pasosDeBaile.filter((paso) => medios.includes(paso.nombre));
const pasosFinales = pasosDeBaile.filter((paso) => finales.includes(paso.nombre));

console.log("Pasos iniciales: ", pasosIniciales.map(paso => paso.nombre));
console.log("Pasos medios: ", pasosMedios.map(paso => paso.nombre));
console.log("Pasos finales: ", pasosFinales.map(paso => paso.nombre));

let duracionTotal;
if (duracionTotalSelect.value === "custom") {
  duracionTotal = parseInt(duracionTotalPersonalizada.value);
} else {
  duracionTotal = parseInt(duracionTotalSelect.value);
}

// Generar todas las combinaciones posibles con los pasos agregados para una duración total
let todasLasCombinaciones = [];

  const pasosAgregados = [...pasosIniciales, ...pasosMedios, ...pasosFinales];
  
  let claveCache = JSON.stringify({pasos: pasosAgregados, duracion: duracionTotal});
  console.log("Pasos agregados:", pasosAgregados.map(paso => paso.nombre));
  console.log("Duración total:", duracionTotal);
  // Si la duración total o los pasos agregados han cambiado, limpiamos la caché
if (duracionTotal !== ultimaDuracionTotal || JSON.stringify(pasosAgregados) !== JSON.stringify(ultimosPasosAgregados)) {
  combinacionesCache = {};
  ultimaDuracionTotal = duracionTotal;
  ultimosPasosAgregados = [...pasosAgregados];
  
  // Generamos las combinaciones y las guardamos en la caché
  let combinaciones = generarCombinacionesDuracion(pasosAgregados, duracionTotal);
  combinacionesCache[claveCache] = combinaciones;
}

// Usamos las combinaciones de la caché
todasLasCombinaciones = combinacionesCache[claveCache];

// Imprimimos la información de la caché
console.log("Cantidad de conjuntos de combinaciones en caché:", Object.keys(combinacionesCache).length);
for (let clave in combinacionesCache) {
  let datos = JSON.parse(clave);
  console.log("Combinaciones en caché: ", datos.pasos.map(paso => paso.nombre), combinacionesCache[clave]);
}
  


  // Filtrar las combinaciones para encontrar las que cumplen con los criterios
    const combinacionesValidas = todasLasCombinaciones.filter(combinacion => {
    const inicioValido = pasosIniciales.some(paso => paso.nombre === combinacion[0].nombre);
    const finValido = pasosFinales.some(paso => paso.nombre === combinacion[combinacion.length - 1].nombre);
    const mediosValidos = combinacion.slice(1, -1).every(paso => pasosMedios.some(pasoMedio => pasoMedio.nombre === paso.nombre));
    return inicioValido && finValido && mediosValidos;
  });

  if (combinacionesValidas.length === 0) {
    console.log("No se pudo generar una coreografía con los pasos dados y la duración total");
    return [];
  }

  // Seleccionar una combinación válida aleatoria
  const combinacionSeleccionada = combinacionesValidas[Math.floor(Math.random() * combinacionesValidas.length)];

  const coreografia = combinacionSeleccionada;
  console.log("Coreografía generada:", coreografia);
  return coreografia;
}


//Funcion MostrarCoreo

function MostrarCoreografia() {
  console.log('La función MostrarCoreografia ha sido llamada');

  const coreografia = generarCoreografia();
  
    
  
    coreografiasGeneradas.push(coreografia);
    indiceCoreografia = coreografiasGeneradas.length - 1;

    console.log("Mostrando coreografía:", coreografia);

    mostrarCoreografiaEnLista(coreografia);
  }

function mostrarCoreografiaEnLista(coreografia) {

    const lista = document.getElementById("coreografia");
  
    lista.innerHTML = "";
  console.log("Mostrando coreografía en la lista:", coreografia);

    for (let paso of coreografia) {
      const li = document.createElement("li");
      li.classList.add('pasocoreo');
      const nombre = document.createElement("h3");
      const info = document.createElement("ul"); // Creamos un elemento ul para la información adicional
  
      nombre.innerText = paso.nombre;
      const duracion = document.createElement("li");
      duracion.innerText = `Duración: ${paso.duracion} tiempos`;
      const inicio = document.createElement("li");
      inicio.innerText = `Inicio: ${paso.inicio}`;
      const fin = document.createElement("li");
      fin.innerText = `Fin: ${paso.fin}`;
  
      // Añadimos los eventos para mostrar/ocultar la información adicional
      nombre.addEventListener("mouseover", () => {
        info.style.display = "block";
      });
  
      nombre.addEventListener("mouseout", () => {
        info.style.display = "none";
      });
  
      info.style.display = "none"; // Inicialmente, el elemento ul no se muestra
  
      // Agregamos los elementos li a la lista ul
      info.appendChild(duracion);
      info.appendChild(inicio);
      info.appendChild(fin);
  
      li.appendChild(nombre);
      li.appendChild(info);
  
      lista.appendChild(li);
    }
  }

//Función para navegar entre coreos
function moverIzquierda() {
    if (indiceCoreografia > 0) {
      indiceCoreografia--;
      mostrarCoreografiaEnLista(coreografiasGeneradas[indiceCoreografia]);
    }
    }
  
function moverDerecha() {
    if (indiceCoreografia < coreografiasGeneradas.length - 1) {
      indiceCoreografia++;
      mostrarCoreografiaEnLista(coreografiasGeneradas[indiceCoreografia]);
    }
    }
  
//Mostrar Duracion Personalizada
function mostrarOcultarPersonalizada() {
    const duracionTotalSelect = document.getElementById("duracionTotal");
    const duracionTotalPersonalizada = document.getElementById("duracionTotalPersonalizada");
  
    if (duracionTotalSelect.value === "custom") {
      duracionTotalPersonalizada.style.display = "inline";
    } else {
      duracionTotalPersonalizada.style.display = "none";
    }
  }

// Crea una función que maneje el evento "drop"
function handleDrop(e) {
  e.stopPropagation();
  e.preventDefault();

  // Identifica si el elemento donde se soltó el paso es un icono-container o un subcontenedor
  let container = e.currentTarget;
  let subcontenedor;
  
  if (container.classList.contains("icono-container")) {
    // Si el elemento es un icono-container, encuentra el subcontenedor correspondiente
    const id = container.querySelector(".icono-wrapper").children[0].id;
    subcontenedor = document.querySelector(`.subcontenedor[data-icono-id="${id}"]`);
  } else if (container.classList.contains("subcontenedor")) {
    // Si el elemento es un subcontenedor, úsalo directamente
    subcontenedor = container;
  }

  // Si encontramos un subcontenedor, agrega el paso a ese subcontenedor
  if (subcontenedor) {
      // Obtén origenId de los pasos seleccionados o del paso arrastrado
  const origenId = pasosSeleccionados.length > 0 ? pasosSeleccionados[0].origenId : JSON.parse(e.dataTransfer.getData("text/plain")).origenId;

  // Si el origen y el destino son el mismo y el origen no es nulo, simplemente return para no hacer nada
  if (origenId && origenId === subcontenedor.id) {
    return;
  }

    // Verifica si hay pasos seleccionados
    if (pasosSeleccionados.length > 0) {
      // Maneja cada paso en pasosSeleccionados
      pasosSeleccionados.forEach((paso) => {
        const origenId = paso.origenId;
        if (origenId) console.log(`Received origenId: ${origenId}`);
        
        const subcontenedorOrigen = origenId ? document.getElementById(origenId) : null;

        agregarPasoASubcontenedor(paso);
        const pasoElement = Array.from(subcontenedor.querySelectorAll(".paso"))
        .find(p => p.innerText === paso.nombre);
        if (pasoElement) {
          pasoElement.setAttribute("data-origin", subcontenedor.id);
        }

        // Si subcontenedorOrigen existe, obtén el paso y elimínalo
        if (subcontenedorOrigen) {
          let pasos;
          try {
            pasos = Array.from(subcontenedorOrigen.querySelectorAll(".paso"));
          } catch (error) {
            console.error(`Error al obtener los pasos del subcontenedor: ${error}`);
            pasos = [];
          }
          const pasoElement = pasos.find(p => JSON.parse(p.dataset.jsonEncoded).nombre === paso.nombre);

          console.log(`PasoElement exists: ${!!pasoElement}`);
          
          if (pasoElement) {
            pasoElement.parentNode.removeChild(pasoElement);
          }
        } else if (origenId) {
          console.error(`No se encontró el subcontenedor con id: ${origenId}`);
        }
      });

      // Limpia pasosSeleccionados después de procesarlos
      pasosSeleccionados = [];
    } else {
      // Maneja un solo paso
      const paso = JSON.parse(e.dataTransfer.getData("text/plain"));
      const origenId = paso.origenId;
      if (origenId) console.log(`Received origenId: ${origenId}`);
      
      const subcontenedorOrigen = origenId ? document.getElementById(origenId) : null;

      agregarPasoASubcontenedor(paso);
      const pasoElement = Array.from(subcontenedor.querySelectorAll(".paso"))
      .find(p => p.innerText === paso.nombre);
      if (pasoElement) {
        pasoElement.setAttribute("data-origin", subcontenedor.id);
      }

      // Si subcontenedorOrigen existe, obtén el paso y elimínalo
      if (subcontenedorOrigen) {
        let pasos;
        try {
          pasos = Array.from(subcontenedorOrigen.querySelectorAll(".paso"));
        } catch (error) {
          console.error(`Error al obtener los pasos del subcontenedor: ${error}`);
          pasos = [];
        }
        const pasoElement = pasos.find(p => JSON.parse(p.dataset.jsonEncoded).nombre === paso.nombre);
        console.log(`PasoElement exists: ${!!pasoElement}`);
        
        if (pasoElement) {
          pasoElement.parentNode.removeChild(pasoElement);
        }
      } else if (origenId) {
        console.error(`No se encontró el subcontenedor con id: ${origenId}`);
      }
    }
  }
}

//Función para agregar pasos a los subcontenedores
function agregarPasoASubcontenedor(paso) {
  const subcontenedores = document.querySelectorAll(".subcontenedor");
  let subcontenedorActivo = null;

  subcontenedores.forEach((subcontenedor) => {
    if (subcontenedor.style.display === "block") {
      subcontenedorActivo = subcontenedor;
    }
  });

  if (subcontenedorActivo) {
    if (!Array.isArray(paso)) {
      paso = [paso];
    }

    paso.forEach((paso) => {
      const pasoYaEnSubcontenedor = Array.from(subcontenedorActivo.querySelectorAll(".paso")).some(
        (pasoElement) => {
          const pasoData = JSON.parse(pasoElement.getAttribute("data-json-encoded"));
          return pasoData.nombre === paso.nombre;
        }
      );

      if (!pasoYaEnSubcontenedor) {
        const origenId = subcontenedorActivo.id;
        const pasoElement = crearPasoElement(paso, subcontenedorActivo, origenId);
        subcontenedorActivo.appendChild(pasoElement);
    
        // Aquí es donde añadimos el botón con la 'X' usando Font Awesome
        const closeIcon = document.createElement("i");
        closeIcon.classList.add('fa-solid', 'fa-xmark');
        closeIcon.style.display = 'none'; // Hacer el botón invisible al principio
        pasoElement.appendChild(closeIcon);

    
        pasoElement.onmouseenter = function(event) {
          closeIcon.style.display = 'inline'; // Mostrar la 'X' cuando el mouse entra en el paso
        };
    
        pasoElement.onmouseleave = function(event) {
          closeIcon.style.display = 'none'; // Ocultar la 'X' cuando el mouse sale del paso
        };
    
        closeIcon.onclick = function(event) {
          event.stopPropagation(); // Prevenir que el click en la 'X' active los otros manejadores de eventos del paso
          eliminarPasoConClick(paso, pasoElement);
        };
        
        
      }
    });
  }
}
  
  
function agregarPaso(nombre, duracion, posicionInicial, posicionFinal, etapas, frente, mismoFrente) {
  const frenteArray = frente === "ambos" ? ["izquierda-derecha", "derecha-izquierda"] : [frente];
  const inicioArray = posicionInicial === "ambos" ? ["cerrada", "abierta"] : [posicionInicial];
  const finArray = posicionFinal === "ambos" ? ["cerrada", "abierta"] : [posicionFinal];
  
  const nuevoPaso = { 
    nombre, 
    duracion: parseInt(duracion),
    inicio: inicioArray, 
    fin: finArray,
    frente: frenteArray,
    mismoFrente: mismoFrente === 'Sí' ? true : (mismoFrente === 'No' ? false : null),
    categoria: "Mis Pasos"
  };

  // Añade el nuevo paso a la lista de pasos de baile
  pasosDeBaile.push(nuevoPaso);
  console.log("Paso agregado a la lista de pasosDeBaile:", nuevoPaso);

  // Agregar el nuevo paso al contenedor de pasos en la categoría 'Mis Pasos'
  const categorias = document.querySelectorAll('.categoria');
  const categoriaMisPasos = Array.from(categorias).find(categoria => categoria.querySelector('.nombre-categoria').textContent === 'Mis Pasos');
  if (categoriaMisPasos) {
    const pasoItem = crearPasoElement(nuevoPaso, categoriaMisPasos.querySelector(".pasos"), "menu");  // Agrega el paso al menu
    pasoItem.setAttribute('data-origin', "menu");
  }

  // Luego, agregar el paso a los subcontenedores seleccionados
  if(etapas.length > 0) {
    etapas.forEach((etapa) => {
      agregarNuevoPasoASubcontenedor(nuevoPaso, etapa);
    });
  }
}


function agregarNuevoPasoASubcontenedor(paso, etapa) {
  let subcontenedorId;
  if (etapa === "Inicial") {
    subcontenedorId = "iniciales"; 
  } else if (etapa === "Medio") {
    subcontenedorId = "medios"; 
  } else {
    subcontenedorId = "finales"; 
  }
  const subcontenedor = document.getElementById(subcontenedorId);

  const pasoItem = crearPasoElement(paso, subcontenedor, subcontenedorId);  // Agrega el paso al subcontenedor correspondiente
  pasoItem.setAttribute('data-origin', subcontenedorId);

  // Aquí es donde añadimos el botón con la 'X' usando Font Awesome
  const closeIcon = document.createElement("i");
  closeIcon.classList.add('fa-solid', 'fa-xmark');
  closeIcon.style.display = 'none'; // Hacer el botón invisible al principio
  pasoItem.appendChild(closeIcon);

  pasoItem.onmouseenter = function(event) {
    closeIcon.style.display = 'inline'; // Mostrar la 'X' cuando el mouse entra en el paso
  };

  pasoItem.onmouseleave = function(event) {
    closeIcon.style.display = 'none'; // Ocultar la 'X' cuando el mouse sale del paso
  };

  closeIcon.onclick = function(event) {
    event.stopPropagation(); // Prevenir que el click en la 'X' active los otros manejadores de eventos del paso
    eliminarPasoConClick(paso, pasoItem);
  };
}






configurarModalAgregarPaso();
//Función para configurar el modal

function configurarModalAgregarPaso() {
  const modalAgregarPaso = document.getElementById("modalAgregarPaso");
  const btnAgregar = document.getElementById("agregar");
  const spanClose = document.querySelector(".close");
  const formNuevoPaso = document.getElementById("nuevoPasoForm");

  btnAgregar.addEventListener("click", () => {
    modalAgregarPaso.style.display = "block";
  });

  spanClose.addEventListener("click", () => {
    modalAgregarPaso.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modalAgregarPaso) {
      modalAgregarPaso.style.display = "none";
    }
  });

  formNuevoPaso.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const duracion = document.getElementById("duracion").value;
    const posicionInicial = document.getElementById("posicionInicial").value;
    const posicionFinal = document.getElementById("posicionFinal").value;
    const frente = document.getElementById("frente").value;
    const mismoFrente = document.getElementById("mismoFrente").value;

    const etapas = [];
    if (document.getElementById("inicial").checked) {
      etapas.push("Inicial");
    }
    if (document.getElementById("medio").checked) {
      etapas.push("Medio");
    }
    if (document.getElementById("final").checked) {
      etapas.push("Final");
    }

    // Aquí puedes agregar la función para manejar el nuevo paso
    agregarPaso(nombre, duracion, posicionInicial, posicionFinal, etapas, frente, mismoFrente);

    // Limpia el formulario y cierra el modal
    formNuevoPaso.reset();
    modalAgregarPaso.style.display = "none";
  });
}

// Función para activar un subcontenedor y cambiar el color del ícono y la barra
function activarSubcontenedor(contenedor, iconoWrapper) {
  // Desactivar todos los subcontenedores
  iniciales.style.display = 'none';
  medios.style.display = 'none';
  finales.style.display = 'none';
  
  
  
  // Desactivar el color activo de todos los íconos y barras
  const iconos = document.querySelectorAll('.icono-container i');
  const barras = document.querySelectorAll('.icono-container .icono-barra');
  iconos.forEach(icon => icon.classList.remove('iconoActivo'));
  barras.forEach(barra => {
    barra.style.backgroundColor = 'transparent';
    barra.style.display = 'none'; // Agrega esta línea
  });
  
  // Activar el subcontenedor correspondiente y cambiar el color del ícono y la barra
  contenedor.style.display = 'block';
  iconoWrapper.querySelector('i').classList.add('iconoActivo');
  iconoWrapper.querySelector('.icono-barra').style.backgroundColor = '#007bff';
  iconoWrapper.querySelector('.icono-barra').style.display = 'block'; // Agrega esta línea
  }
  
//Funciones para activar barra arrastre debajo de iconos

function mostrarBarra(iconoWrapper) {
  if (iconoWrapper.querySelector('i').classList.contains('iconoActivo')) {
    iconoWrapper.querySelector('.icono-barra').style.display = 'block';
  }
}

function ocultarBarra(iconoWrapper) {
  if (!iconoWrapper.querySelector('i').classList.contains('iconoActivo')) {
    iconoWrapper.querySelector('.icono-barra').style.display = 'none';
  }
}

//Agregar event listener y mouseover-out a íconos y wrappers

function agregarEventListener(elemento, evento, accion) {
  elemento.addEventListener(evento, accion);
}

function agregarEventosAWrapper(wrapper, subcontenedor) {
  agregarEventListener(wrapper, 'mouseover', () => mostrarBarra(wrapper));
  agregarEventListener(wrapper, 'mouseout', () => ocultarBarra(wrapper));
  agregarEventListener(wrapper, 'click', () => activarSubcontenedor(subcontenedor, wrapper));
}

// Función 'activarSubcontenedorDrag' aquí
function activarSubcontenedorDrag(id) {
  const subcontenedores = document.querySelectorAll(".subcontenedor");
  subcontenedores.forEach((subcontenedor) => {
    if (subcontenedor.id === id) {
      subcontenedor.style.display = "block";
      subcontenedor.setAttribute("data-selected", "true");
    } else {
      subcontenedor.style.display = "none";
      subcontenedor.setAttribute("data-selected", "false");
    }
  });

  // Activar el efecto hover y cambiar el color del ícono y la barra
  const iconoWrapper = document.querySelector(`.icono-container:nth-child(${id === "iniciales" ? 1 : id === "medios" ? 2 : 3}) .icono-wrapper`);
  const contenedor = document.getElementById(id);
  activarSubcontenedor(contenedor, iconoWrapper);
}

// Crear nuevo elemento de paso

function crearPasoElement(paso, contenedor, origenId) {
  const pasoItem = document.createElement("li");
  pasoItem.classList.add("paso");
  pasoItem.innerText = paso.nombre;
  pasoItem.setAttribute("data-json-encoded", JSON.stringify(paso));
  if (origenId) {
    pasoItem.setAttribute("data-origin", origenId);
  }
  contenedor.appendChild(pasoItem);
  agregarManejadoresDeEventosAlPaso(pasoItem, paso);  // Agrega los manejadores de eventos aquí
  return pasoItem;
}
//Funciones agregar eventos a pasos

const DATA_JSON_ENCODED = "data-json-encoded";
const DATA_ORIGIN = "data-origin";

function obtenerPasoData(pasoItem) {
  return JSON.parse(pasoItem.getAttribute(DATA_JSON_ENCODED));
}

function manejarClickEnPaso(pasoItem) {
  pasoItem.addEventListener('click', () => {
    pasoItem.classList.toggle('seleccionado');
    const pasoData = obtenerPasoData(pasoItem);

    // Si el paso se está seleccionando, actualiza el origenId
    if (pasoItem.classList.contains('seleccionado')) {
      pasoData.origenId = pasoItem.getAttribute('data-origin');
      
      // Actualiza el atributo data-origin con el origenId actualizado
      pasoItem.setAttribute('data-origin', pasoData.origenId);
      
      pasoItem.setAttribute("data-json-encoded", JSON.stringify(pasoData));

      // Añade directamente los datos del paso a pasosSeleccionados
      pasosSeleccionados.push(pasoData);
      
      // Agrega este console.log aquí
      console.log(`Selecting ${pasoData.nombre} from originId: ${pasoData.origenId}`);
    } else { 
      // Si el paso se está deseleccionando, elimina el paso del array pasosSeleccionados
      pasosSeleccionados = pasosSeleccionados.filter(paso => paso.nombre !== pasoData.nombre);
    }
    console.log('Pasos seleccionados:', pasosSeleccionados);
  });
}


function manejarDobleClickEnPaso(pasoItem, paso, esPasoEnSubcontenedor) {
  if (!esPasoEnSubcontenedor) {
    pasoItem.addEventListener("dblclick", (e) => {
      const origenId = e.target.getAttribute(DATA_ORIGIN);
      agregarPasoASubcontenedor(paso, origenId);
      pasoItem.classList.remove('seleccionado');

      // Elimina el paso de pasosSeleccionados utilizando los datos del paso (sin copiar)
      pasosSeleccionados = pasosSeleccionados.filter(pasoSeleccionado => pasoSeleccionado !== paso);
      
      // Prevent click event
      e.stopPropagation();
    });
  }
}

function manejarArrastreDePaso(pasoItem) {
  pasoItem.setAttribute("draggable", "true");
pasoItem.addEventListener("dragstart", (e) => {
  const pasoData = obtenerPasoData(pasoItem);
  const origenId = pasoItem.getAttribute(DATA_ORIGIN);

  const isPasoAlreadySelected = pasosSeleccionados.some(
    (pasoSeleccionado) =>
      pasoSeleccionado.nombre === pasoData.nombre
  );

  if (!isPasoAlreadySelected) {
    // Si el paso arrastrado actualmente no está en pasosSeleccionados,
    pasosSeleccionados.forEach((pasoSeleccionado) => {
      const pasoElement = document.querySelector(
        `[data-json-encoded='${JSON.stringify(pasoSeleccionado)}']`
      );
      pasoElement.classList.remove("selected");
    });

    // Actualiza pasosSeleccionados para incluir solo el paso que se está arrastrando
    pasosSeleccionados = [pasoData];
    pasoItem.classList.add("selected");  
  }

  const esSeleccionado = pasoItem.classList.contains('seleccionado');

  if (esSeleccionado && pasosSeleccionados.length > 1) {
    const pasosSeleccionadosData = pasosSeleccionados.map(pasoSeleccionado => {
      return pasoSeleccionado;
    });
    e.dataTransfer.setData("text/plain", JSON.stringify(pasosSeleccionadosData));

    // Obtiene los diferentes origenId de los pasos seleccionados
    let origenIds = [...new Set(pasosSeleccionados.map(paso => paso.origenId))];

    console.log(`Dragging from originId: ${origenIds.join(' & ')}`);
  } else {
    pasoData.origenId = origenId;
    e.dataTransfer.setData("text/plain", JSON.stringify(pasoData));
    console.log(`Dragging from originId: ${origenId}`);
  }
});

  pasoItem.addEventListener("dragend", () => {    
    const pasosSeleccionados = Array.from(document.querySelectorAll(".paso.seleccionado"));
    pasosSeleccionados.forEach(paso => {
      paso.classList.remove("seleccionado");
      paso.classList.remove("arrastrando");
    });
  });
}

function agregarManejadoresDeEventosAlPaso(pasoItem, paso, esPasoEnSubcontenedor) {
  manejarClickEnPaso(pasoItem);
  manejarDobleClickEnPaso(pasoItem, paso, esPasoEnSubcontenedor);
  manejarArrastreDePaso(pasoItem);
}


//Función eliminar pasos

function eliminarPaso(pasoData) {
  // Asegurándonos de que pasoData sea un array para manejar la eliminación múltiple de pasos
  if (!Array.isArray(pasoData)) {
    pasoData = [pasoData];
  }
  
  // Iterar sobre cada paso a eliminar
  pasoData.forEach(paso => {
    const pasoDataNombre = paso.nombre;
    const pasoDataOrigenId = paso.origenId;

    // Buscar el paso a eliminar en el subcontenedor correcto
    const subcontenedorCorrecto = document.querySelector(`#${pasoDataOrigenId}`);
    const pasosEnSubcontenedor = Array.from(subcontenedorCorrecto.querySelectorAll('.paso'));

    pasosEnSubcontenedor.forEach(pasoElement => {
      const pasoElementData = JSON.parse(pasoElement.getAttribute("data-json-encoded"));
      
      // Comprueba si el paso en el subcontenedor coincide con el paso que se está eliminando
      if (pasoElementData.nombre === pasoDataNombre) {
        // Si coincide, elimina el paso del subcontenedor
        subcontenedorCorrecto.removeChild(pasoElement);
      }
    });
  });

  // Limpia pasosSeleccionados después de la eliminación
  pasosSeleccionados = [];
}


function eliminarPasoConClick(paso, pasoElemento) {
  // Encuentra el subcontenedor donde está el paso
  const subcontenedor = pasoElemento.parentElement;

  // Elimina el paso del subcontenedor
  subcontenedor.removeChild(pasoElemento);

  // Comprueba si el paso fue seleccionado
  const pasoFueSeleccionado = pasosSeleccionados.find(pasoSeleccionado => pasoSeleccionado.nombre === paso.nombre);
  
  // Si fue seleccionado, elimínelo de la lista de pasos seleccionados
  if (pasoFueSeleccionado) {
    pasosSeleccionados = pasosSeleccionados.filter(pasoSeleccionado => pasoSeleccionado.nombre !== paso.nombre);
  }
}




// Esperar a que el contenido del DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  
  // Definir las categorías y sus íconos correspondientes
  const categorias = [
    "Pasos Básicos",
    "Pasos Intermedios",
    "Pasos Flasheros",
    "Pasos Clásicos",
    "Mis Pasos"
  ];

  const iconosCategorias = {
    "Pasos Básicos": "icons/basicos-t2.svg",
    "Pasos Intermedios": "icons/intermedios-t.svg",
    "Pasos Flasheros": "icons/flasheros-t.svg",
    "Pasos Clásicos": "icons/clasicos-t.svg",
    "Mis Pasos": "icons/mis-pasos-t.svg",
  };

  // Obtener el contenedor de categorías y pasos
  const categoriasPasos = document.getElementById("categoriasPasos");

  // Iterar sobre las categorías y crear elementos de lista para cada una
  categorias.forEach((categoria) => {
    const categoriaItem = document.createElement("li");
    categoriaItem.classList.add("categoria");
    categoriaItem.innerHTML = `<h3><img src="${iconosCategorias[categoria]}" alt="Icono de categoría" class="icono-categoria" /><span class="nombre-categoria">${categoria}</span></h3><ul class="pasos"></ul>`;
    categoriasPasos.appendChild(categoriaItem);

   // Agregar los pasos de baile a cada categoría
const pasosContainer = categoriaItem.querySelector(".pasos");
pasosDeBaile
  .filter((paso) => paso.categoria === categoria)
  .forEach((paso) => {
    crearPasoElement(paso, pasosContainer, "menu"); // Pasar "menu" como origenId        
               
      });
    });


  
// Seleccionar los elementos
const iconoInicialesWrapper = document.querySelector('#iconoIniciales').parentElement;
const iconoMediosWrapper = document.querySelector('#iconoMedios').parentElement;
const iconoFinalesWrapper = document.querySelector('#iconoFinales').parentElement;

const iniciales = document.getElementById("iniciales");
const medios = document.getElementById("medios");
const finales = document.getElementById("finales");


//Event listenner a íconos, wrapper etc..
agregarEventosAWrapper(iconoInicialesWrapper, iniciales);
agregarEventosAWrapper(iconoMediosWrapper, medios);
agregarEventosAWrapper(iconoFinalesWrapper, finales);

 // Activar el primer subcontenedor por defecto
 activarSubcontenedor(iniciales, iconoInicialesWrapper);


  // Añadir un event listener a las categorías para expandir o contraer los pasos
  const categoriaItems = document.querySelectorAll(".categoria h3");
  categoriaItems.forEach((categoriaItem) => {
    categoriaItem.addEventListener("click", () => {
      categoriaItem.parentElement.classList.toggle("active");
    });
  });




  // Manejar #Acciones
  const botonNavegarAtras = document.getElementById("navegarAtras");
  botonNavegarAtras.addEventListener("click", moverIzquierda);

  const botonNavegarAdelante = document.getElementById("navegarAdelante");
  botonNavegarAdelante.addEventListener("click", moverDerecha);

  const duracionTotal = document.getElementById("duracionTotal");

  duracionTotal.addEventListener("change", mostrarOcultarPersonalizada);
  const botonGenerarCoreografia = document.getElementById("generarCoreografia");
  botonGenerarCoreografia.addEventListener("click", MostrarCoreografia);


// Obtén todos los subcontenedores y los icono-containers
const subcontenedores = document.querySelectorAll(".subcontenedor");
const iconoContainers = document.querySelectorAll(".icono-container");


// Agrega el manejador de eventos a todos los subcontenedores e icono-containers
subcontenedores.forEach((subcontenedor) => {
  subcontenedor.addEventListener("dragover", (e) => {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  subcontenedor.addEventListener("drop", handleDrop);
});

iconoContainers.forEach((iconoContainer) => {
  iconoContainer.addEventListener("dragover", (e) => {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  iconoContainer.addEventListener("drop", handleDrop);
});


const iconoContainerNames = ["iniciales", "medios", "finales"];

iconoContainerNames.forEach((container, index) => {
  const iconoContainer = document.querySelector(`.icono-container:nth-child(${index + 1})`);
  iconoContainer.addEventListener("dragenter", () => {
    activarSubcontenedorDrag(container);
  });
});

//referencia al icono de papelera
const iconoPapelera = document.getElementById("iconoPapelera");
iconoPapelera.addEventListener("dragover", (e) => {
  e.preventDefault(); // esto permite que se suelten elementos aquí
});

//evento drop papelera

iconoPapelera.addEventListener("drop", (e) => {
  e.preventDefault(); // esto permite que se suelten elementos aquí
  // esto obtiene los datos que configuraste en el evento 'dragstart'
  let pasosData = JSON.parse(e.dataTransfer.getData("text/plain"));
  
  if (!Array.isArray(pasosData)) {
    pasosData = [pasosData];
  }

  for (const pasoData of pasosData) {
    eliminarPaso(pasoData);
  }
});

//Evento select ALL
const btnSeleccionarTodo = document.querySelector(".fa-check-double"); 

btnSeleccionarTodo.addEventListener("click", () => {
  const subcontenedores = document.querySelectorAll(".subcontenedor");
  let subcontenedorActivo = null;

  subcontenedores.forEach((subcontenedor) => {
    if (subcontenedor.style.display === "block") {
      subcontenedorActivo = subcontenedor;
    }
  });

  if (subcontenedorActivo) {
    const pasos = subcontenedorActivo.querySelectorAll(".paso");
    let todosSeleccionados = true;
    
    pasos.forEach((paso) => {
      if (!paso.classList.contains("seleccionado")) {
        todosSeleccionados = false;
      }
    });

    pasos.forEach((paso) => {
      if (todosSeleccionados) {
        paso.click(); // Deseleccionar paso
      } else {
        if (!paso.classList.contains("seleccionado")) {
          paso.click(); // Seleccionar paso
        }
      }
    });
  }
});

// Código de modal existente
var modal = document.getElementById("favModal");
var btn = document.getElementById("iconoSave");
var span = document.getElementsByClassName("close")[0];

btn.onclick = function() {
  modal.style.display = "block";
}

span.onclick = function() {
  modal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

// Funcionalidad para los botones "Hecho" y "Quitar"


document.getElementById("quitar").onclick = function() {
  // Funcionalidad para quitar la coreografía
  console.log('Quitar clicked');
}

// Crear carpeta
document.getElementById("carpetas").onchange = function() {
  // Si se selecciona "Crear Carpeta", mostramos el campo de entrada de texto "Nueva Carpeta"
  if (this.value == "Crear Carpeta") {
      document.getElementById("nuevaCarpetaDiv").style.display = "block";
  } else {
      document.getElementById("nuevaCarpetaDiv").style.display = "none";
  }
}

document.getElementById("hecho").onclick = function() {
  var nombre = document.getElementById("nombre").value;
  var carpeta = document.getElementById("carpetas").value;
  var nuevaCarpeta = document.getElementById("nuevaCarpeta").value;

  var coreografia = coreografiasGeneradas[indiceCoreografia]; // Usamos la última coreografía generada

  if (carpeta == "Crear Carpeta" && nuevaCarpeta) {
    // Si no existe la nueva carpeta, la creamos
    if (!favoritos.carpetas[nuevaCarpeta]) {
      favoritos.carpetas[nuevaCarpeta] = [];
    }
    // Agregamos la coreografía a la carpeta
    favoritos.carpetas[nuevaCarpeta].push({nombre: nombre, coreografia: coreografia});

    console.log('Nueva carpeta creada: ' + nuevaCarpeta);
    console.log('Coreografía ' + nombre + ' guardada en la carpeta ' + nuevaCarpeta);
  } else {
    // Si no existe la carpeta seleccionada, la creamos
    if (!favoritos.carpetas[carpeta]) {
      favoritos.carpetas[carpeta] = [];
    }
    // Agregamos la coreografía a la carpeta
    favoritos.carpetas[carpeta].push({nombre: nombre, coreografia: coreografia});

    console.log('Coreografía ' + nombre + ' guardada en la carpeta ' + carpeta);
  }

  // Actualizamos la lista de favoritos en el menú desplegable
  actualizarFavoritos();
}

// Esta función actualiza la lista de favoritos en el menú desplegable
function actualizarFavoritos() {
  var lista = document.getElementById("favoritos-lista");

  // Limpiamos la lista actual
  while (lista.firstChild) {
    lista.removeChild(lista.firstChild);
  }

  // Por cada carpeta y cada coreografía en cada carpeta, agregamos un elemento a la lista
  for (var nombreCarpeta in favoritos.carpetas) {
    var liCarpeta = document.createElement("li");
    var aCarpeta = document.createElement("a");
    aCarpeta.className = "dropdown-item";
    aCarpeta.href = "#";
    aCarpeta.innerText = nombreCarpeta;
    liCarpeta.appendChild(aCarpeta);
    lista.appendChild(liCarpeta);

    var divDropdownCarpeta = document.createElement("div");
    divDropdownCarpeta.className = "dropdown";
    aCarpeta.appendChild(divDropdownCarpeta);

    var ulCoreografias = document.createElement("ul");
    divDropdownCarpeta.appendChild(ulCoreografias);

    for (var coreografia of favoritos.carpetas[nombreCarpeta]) {
      var liCoreografia = document.createElement("li");
      liCoreografia.innerText = coreografia.nombre;
      ulCoreografias.appendChild(liCoreografia);
    }
  }
}


/*Menu DropDown*/ 
var menuButton = document.querySelector("#menu-button");
menuButton.addEventListener("click", function(event) {
  event.stopPropagation();
  var dropdown = this.nextElementSibling; // Assuming dropdown is the next element after img
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
});

// Hide the dropdown when clicked anywhere outside
window.addEventListener("click", function(event) {
  var dropdown = document.querySelector(".menuDrop-container .dropdown");
  if (dropdown.style.display === "block") {
    dropdown.style.display = "none";
  }
});



});

