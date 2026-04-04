// Coordenadas fixas da casa
const coordsCasa = [-51.0239, -30.0815];

// Função para transformar endereço em coordenadas
async function geocode(endereco) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(endereco)}&format=json&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro no servidor de geocoding");
  const data = await res.json();
  if (!data || data.length === 0) throw new Error("Endereço não encontrado: " + endereco);
  return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
}

// Validação Rio Grande do Sul
function validarRS([lon, lat], campo) {
  if (!(lat <= -27.35 && lat >= -33.75 && lon >= -54.366 && lon <= -49.75)) {
    throw new Error(`${campo} deve estar no Rio Grande do Sul`);
  }
}

// Elemento resultado
const resultadoDiv = document.getElementById("resultado");

// Função principal
async function enviarWhats() {
  const botao = document.querySelector(".frete");
  botao.innerHTML = "⏳ Calculando...";
  botao.disabled = true;

  const retirada = document.getElementById("retirada").value.trim();
  const destino = document.getElementById("destino").value.trim();
  const carga = document.getElementById("carga").value.trim();
  const escada = document.getElementById("escada").value.trim();
  const ajudante = document.getElementById("ajudante").value.trim();
  const datahora = document.getElementById("datahora").value.trim();

  if (!retirada || !destino || !carga || !escada || !ajudante || !datahora) {
    alert("Preencha todos os campos!");
    resetBotao();
    return;
  }

  try {
    const coordsRetirada = await geocode(retirada);
    validarRS(coordsRetirada, "Retirada");

    const coordsDestino = await geocode(destino);
    validarRS(coordsDestino, "Destino");

    const res = await fetch("http://localhost:3000/calcular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coordsCasa: coordsCasa.map(Number),
        coordsRetirada: coordsRetirada.map(Number),
        coordsDestino: coordsDestino.map(Number),
        retirada,
        destino,
        ajudante,
        escada
      })
    });

    if (!res.ok) {
      const erroText = await res.text();
      throw new Error("Erro ao calcular frete: " + erroText);
    }

    const data = await res.json();

    resultadoDiv.style.display = "block";
    resultadoDiv.innerHTML = `
      <h3>💰 Orçamento Aproximado</h3>
      <p>Distância: ${data.km} km</p>
      <p>Preço: R$ ${data.preco}</p>
      <button id="enviarWpp" class="btn-wpp">📩 Enviar pedido para WhatsApp</button>
    `;

    document.getElementById("enviarWpp").addEventListener("click", () => {
      const mensagem = `Orçamento de frete:
Retirada: ${retirada}
Destino: ${destino}
Distância: ${data.km} km
Preço: R$ ${data.preco}
Ajudante: ${ajudante}
Escada: ${escada}
Carga: ${carga}
Data/Hora: ${datahora}`;
      const numero = "5551989437457"; // seu número
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
    });

  } catch (err) {
    console.error(err);
    alert(err.message || "Erro ao calcular rota");
  }

  resetBotao();
}

function resetBotao() {
  const botao = document.querySelector(".frete");
  botao.innerHTML = "Calcular frete";
  botao.disabled = false;
}

// Salva valores no localStorage
document.querySelectorAll("input").forEach(input => {
  input.addEventListener("input", () => localStorage.setItem(input.id, input.value));
  input.value = localStorage.getItem(input.id) || "";
});