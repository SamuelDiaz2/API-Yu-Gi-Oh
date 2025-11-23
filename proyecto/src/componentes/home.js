export default async function mostrarHome() {
    const appContainer = document.getElementById("app");
    if (!appContainer) {
        console.error("Contenedor 'app' no encontrado.");
        return;
    }

    appContainer.innerHTML = "<h2>Cargando cartas de Yu-Gi-Oh!...</h2>";

    try {
        // 1. Cargar los datos de la API
        const response = await fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php");
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // La API devuelve un objeto con una clave 'data' que contiene el array de cartas.
        // Solo tomaremos las primeras 50 cartas para no saturar la página
        const cartas = data.data.slice(0, 20); 

        // 2. Limpiar contenedor
        appContainer.innerHTML = "";

        // 3. Recorrer cada carta y construir la tarjeta
        cartas.forEach((card) => {
            
            // Obtener el URL de la imagen. La API la anida dentro de un array 'card_images'
            const imageUrl = card.card_images && card.card_images.length > 0 
                             ? card.card_images[0].image_url_small 
                             : 'placeholder.png'; // Fallback por si no hay imagen

            // Construir la tarjeta (card)
            const cardElement = document.createElement("div");
            cardElement.classList.add("app-card");
            cardElement.innerHTML = `
                <img src="${imageUrl}" alt="Imagen de ${card.name}">
                <div class="app-info">
                    <h3>${card.name}</h3>
                    <p><strong>Tipo:</strong> ${card.type}</p>
                    <p><strong>Raza/Atributo:</strong> ${card.race} / ${card.attribute || 'N/A'}</p>
                    <p><strong>Descripción:</strong> ${card.desc}</p>
                    ${card.atk !== undefined && card.def !== undefined ? 
                        `<p><strong>ATK / DEF:</strong> ${card.atk} / ${card.def}</p>` 
                        : ''}
                    <p><strong>Nivel/Rango:</strong> ${card.level || card.rank || 'N/A'}</p>
                </div>
            `;
            appContainer.appendChild(cardElement);
        });

    } catch (error) {
        console.error("Error al cargar los datos:", error);
        appContainer.innerHTML = "<p>Error al cargar las cartas 😢. Revisa la consola para más detalles.</p>";
    }
}