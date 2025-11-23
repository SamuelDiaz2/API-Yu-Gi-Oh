import { db } from '../firebaseConfig.js'; 
import { collection, addDoc } from 'firebase/firestore';

// ----------------------------------------------------------------------
// --- 1. ESTRUCTURAS DE DATOS Y PERSISTENCIA (Sin cambios) ---
// ----------------------------------------------------------------------

class Carta {
    constructor(nombre, poder, imagenUrl) {
        this.nombre = nombre;
        this.poder = poder;
        this.imagenUrl = imagenUrl;
    }
}

class Jugador {
    constructor(nombre, mazo) {
        this.nombre = nombre;
        this.mazo = mazo;
    }
}

async function guardarResultadoEnDB(registroBatalla) {
    try {
        const docRef = await addDoc(collection(db, "batallas"), registroBatalla);
        return { codigo: 200, mensaje: `Registro guardado con ID: ${docRef.id}`, idRegistro: docRef.id };
    } catch (e) {
        console.error("Error al añadir el documento a Firestore: ", e);
        throw { codigo: 500, mensaje: "Error de persistencia en Firebase.", errorDetalle: e };
    }
}

function renderizarResultadoBatalla(appContainer, registro) {
    // [Se mantiene el código de renderizado HTML del resultado de la batalla]
    const ganador = registro.ganador;
    const mensajeGanador = ganador === "Empate" 
        ? `<h3 class="result-message tie">⚖️ ¡Es un EMPATE!</h3>`
        : `<h3 class="result-message winner">🏆 ¡${ganador} GANA la ronda!</h3>`;

    const htmlContent = `
        <div class="battle-container">
            <h1 class="battle-title">⚔️ Resultado de la Batalla ⚔️</h1>
            
            <div class="players-grid">
                <div class="player-card ${ganador === registro.jugador1 ? 'is-winner' : ''}">
                    <h4>${registro.jugador1}</h4>
                    <img src="${registro.cartaJ1Img}" alt="${registro.cartaJ1}" class="card-image">
                    <p>Carta: <strong>${registro.cartaJ1}</strong></p>
                    <p>Poder: <span class="power-stat">${registro.poderJ1}</span></p>
                </div>

                <div class="vs-divider">
                    ${mensajeGanador}
                    <p class="db-status">Guardado en DB: <span id="db-status-text">...</span></p>
                    <button onclick="window.location.reload()">Jugar Otra Vez</button>
                </div>

                <div class="player-card ${ganador === registro.jugador2 ? 'is-winner' : ''}">
                    <h4>${registro.jugador2}</h4>
                    <img src="${registro.cartaJ2Img}" alt="${registro.cartaJ2}" class="card-image">
                    <p>Carta: <strong>${registro.cartaJ2}</strong></p>
                    <p>Poder: <span class="power-stat">${registro.poderJ2}</span></p>
                </div>
            </div>
            
            <p class="timestamp">Registrado: ${new Date(registro.timestamp).toLocaleString()}</p>
        </div>
    `;

    appContainer.innerHTML = htmlContent;
}

// ----------------------------------------------------------------------
// --- 2. FUNCIÓN DE RENDERIZADO DEL FORMULARIO (APLICANDO CORRECCIONES) ---
// ----------------------------------------------------------------------

async function mostrarFormularioBatalla() {
    const appContainer = document.getElementById("app");
    if (!appContainer) return;

    appContainer.innerHTML = "<h2>Cargando cartas disponibles... ⏳</h2>";

    let cartasDisponibles = [];
    try {
        const response = await fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php?num=10&offset=10");
        const data = await response.json();
        
        cartasDisponibles = data.data
            .filter(card => card.atk !== undefined && card.card_images && card.card_images.length > 0)
            .map(card => {
                const poder = card.atk;
                const imageUrl = card.card_images[0].image_url_small; 
                
                return new Carta(card.name, poder, imageUrl);
            });
        
        if (cartasDisponibles.length === 0) {
            appContainer.innerHTML = "<p>Error: No se pudieron cargar cartas válidas (monstruos con ATK) desde la API. Intente de nuevo.</p>";
            return;
        }

    } catch (error) {
        console.error("Error al cargar cartas de la API:", error);
        appContainer.innerHTML = "<p>Error al cargar las cartas de Yu-Gi-Oh!. Revisa la consola 😢</p>";
        return;
    }
    
    // Crear las opciones para el <select>
    const optionsHtml = cartasDisponibles.map(c => 
        // 1. **CLAVE:** USAR '|||' COMO SEPARADOR DE DATOS PARA EVITAR CORTAR LA URL
        // 2. **CLAVE:** QUITAR EL PODER DE LA ETIQUETA VISIBLE (Texto entre <option>...</option>)
        `<option value="${c.nombre}|||${c.poder}|||${c.imagenUrl}">${c.nombre}</option>`
    ).join('');

    appContainer.innerHTML = `
        <div class="battle-setup">
            <h1>Configurar Batalla de Cartas 🚀</h1>
            <form id="battleForm" class="setup-form">
                
                <div class="player-setup">
                    <h3>Jugador 1</h3>
                    <input type="text" id="j1-name" placeholder="Nombre de Jugador 1" value="Ariel" required>
                    <select id="j1-card" required>
                        <option value="" disabled selected>Selecciona tu Carta</option>
                        ${optionsHtml}
                    </select>
                </div>

                <div class="player-setup">
                    <h3>Jugador 2</h3>
                    <input type="text" id="j2-name" placeholder="Nombre de Jugador 2" value="Beto" required>
                    <select id="j2-card" required>
                        <option value="" disabled selected>Selecciona tu Carta</option>
                        ${optionsHtml}
                    </select>
                </div>

                <button type="submit" id="startButton">¡Comenzar Batalla!</button>
                <p id="error-message" style="color: red;"></p>
            </form>
        </div>
    `;

    // 3. Añadir el Event Listener al formulario para iniciar la batalla
    document.getElementById('battleForm').addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const j1Name = document.getElementById('j1-name').value;
        const j2Name = document.getElementById('j2-name').value;
        const j1CardValue = document.getElementById('j1-card').value;
        const j2CardValue = document.getElementById('j2-card').value;

        if (!j1CardValue || !j2CardValue) {
             document.getElementById('error-message').textContent = "Por favor, selecciona una carta para ambos jugadores.";
             return;
        }
        
        // **CLAVE:** USAR '|||' PARA DESESTRUCTURAR, MANTENIENDO LAS TRES PARTES
        const [c1Name, c1Poder, c1Url] = j1CardValue.split('|||');
        const [c2Name, c2Poder, c2Url] = j2CardValue.split('|||');
        
        // Si c1Url o c2Url es "https", algo sigue mal en el split.
        // Pero si el split funciona, la URL completa debe estar aquí.
        
        const carta1 = new Carta(c1Name, parseInt(c1Poder), c1Url);
        const carta2 = new Carta(c2Name, parseInt(c2Poder), c2Url);
        
        const jugador1 = new Jugador(j1Name, [carta1]);
        const jugador2 = new Jugador(j2Name, [carta2]);

        appContainer.innerHTML = "<h2>¡Batalla en curso! 💥</h2>";
        
        await mostrarOriginal(jugador1, jugador2);
    });
}

// ----------------------------------------------------------------------
// --- 4. FUNCIÓN PRINCIPAL DE LA LÓGICA DE BATALLA (Sin cambios) ---
// ----------------------------------------------------------------------

export async function mostrarOriginal(jugador1, jugador2) {
    const appContainer = document.getElementById("app");
    if (!appContainer) return;
    
    const cartaJ1 = jugador1.mazo[0];
    const cartaJ2 = jugador2.mazo[0];
    
    let ganador = (cartaJ1.poder > cartaJ2.poder) ? jugador1.nombre : 
                  (cartaJ2.poder > cartaJ1.poder) ? jugador2.nombre : "Empate";

    const registroBatalla = {
        jugador1: jugador1.nombre,
        cartaJ1: cartaJ1.nombre,
        poderJ1: cartaJ1.poder,
        cartaJ1Img: cartaJ1.imagenUrl,
        jugador2: jugador2.nombre,
        cartaJ2: cartaJ2.nombre,
        poderJ2: cartaJ2.poder,
        cartaJ2Img: cartaJ2.imagenUrl,
        ganador: ganador,
        timestamp: new Date().toISOString()
    };
    
    renderizarResultadoBatalla(appContainer, registroBatalla);
    
    const dbStatusElement = document.getElementById("db-status-text");
    if (dbStatusElement) {
        dbStatusElement.textContent = "Guardando...";
    }

    try {
        const dbStatus = await guardarResultadoEnDB(registroBatalla);
        if (dbStatusElement) {
            dbStatusElement.textContent = `✅ Éxito (${dbStatus.idRegistro.substring(0, 5)}...)`;
            dbStatusElement.classList.add('success');
        }
    } catch (error) {
        if (dbStatusElement) {
            dbStatusElement.textContent = `❌ Fallo de DB`;
            dbStatusElement.classList.add('error');
        }
    }
    
    return registroBatalla;
}

// ----------------------------------------------------------------------
// --- 5. EXPORTACIÓN POR DEFECTO PARA EL MAIN ---
// ----------------------------------------------------------------------

export default mostrarFormularioBatalla;