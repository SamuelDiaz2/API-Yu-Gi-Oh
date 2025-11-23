import { db } from '../firebaseConfig.js'; 
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

/**
 * Función 'home' actualizada: Muestra el historial de batallas guardadas en Firestore.
 */
export default async function mostrarHome() {
    const appContainer = document.getElementById("app");
    if (!appContainer) return;

    // Mensaje de carga inicial mientras se obtienen los datos
    appContainer.innerHTML = "<h2>Cargando Historial de Batallas... 📜</h2>";

    try {
        // 1. Configurar la consulta a Firestore
        const batallasRef = collection(db, "batallas");
        // Consulta: obtener todos los documentos, ordenados por 'timestamp' de forma descendente (más reciente primero)
        const q = query(batallasRef, orderBy("timestamp", "desc"));
        
        // Obtener los documentos
        const querySnapshot = await getDocs(q);

        let batallas = [];
        querySnapshot.forEach((doc) => {
            // 2. Extraer los datos y el ID
            batallas.push({ id: doc.id, ...doc.data() });
        });

        // 3. Renderizar el historial en el contenedor principal
        renderizarHistorial(appContainer, batallas);

    } catch (error) {
        console.error("Error al obtener el historial de batallas:", error);
        appContainer.innerHTML = "<p class='error-message'>❌ Error al cargar el historial. Revisa la conexión a Firebase y las reglas de seguridad.</p>";
    }
}

/**
 * Genera el HTML para mostrar la lista de batallas.
 */
function renderizarHistorial(container, batallas) {
    if (batallas.length === 0) {
        container.innerHTML = `
            <div class="historial-container">
                <h1>📜 Historial de Batallas</h1>
                <p>Aún no hay batallas registradas.</p>
            </div>
        `;
        return;
    }

    const batallaItems = batallas.map(registro => {
        // Formato legible de la fecha
        const fecha = new Date(registro.timestamp).toLocaleString();
        
        // Lógica para marcar al ganador con un color/clase
        const ganadorClass = registro.ganador === registro.jugador1 
            ? 'winner-j1' 
            : registro.ganador === registro.jugador2 
            ? 'winner-j2' 
            : 'tie';
            
        const resultadoTexto = registro.ganador === "Empate" 
            ? '⚖️ Empate' 
            : `🏆 ${registro.ganador} Gana`;

        return `
            <div class="historial-item ${ganadorClass}">
                <div class="meta-data">
                    <span class="fecha">${fecha}</span>
                    <span class="resultado">${resultadoTexto}</span>
                </div>
                <div class="detalle-batalla">
                    <div class="jugador j1">
                        <strong>${registro.jugador1}</strong>: ${registro.cartaJ1} (${registro.poderJ1})
                    </div>
                    <div class="vs">vs.</div>
                    <div class="jugador j2">
                        <strong>${registro.jugador2}</strong>: ${registro.cartaJ2} (${registro.poderJ2})
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="historial-container">
            <h1>📜 Historial de Batallas Recientes</h1>
            <div class="batallas-list">
                ${batallaItems}
            </div>
        </div>
    `;
}