const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijg4ZTUxNWYzN2VjNjRjZmNiYjg5NDExYWFkODExYTBjIiwiaCI6Im11cm11cjY0In0="; // Substitua pela sua chave

let pedidos = [];

// Limites aproximados do Rio Grande do Sul
function dentroDoRS([lon, lat]) {
  return lat <= -27.35 && lat >= -33.75 && lon >= -54.366 && lon <= -49.75;
}

// Rota para listar pedidos
app.get("/pedidos", (req, res) => {
  res.json(pedidos);
});

// Rota principal
app.post("/calcular", async (req, res) => {
  try {
    const { coordsCasa, coordsRetirada, coordsDestino, ajudante, escada, retirada, destino } = req.body;

    if (!coordsCasa || !coordsRetirada || !coordsDestino)
      return res.status(400).json({ erro: "Coordenadas inválidas" });

    // Validação RS
    if (!dentroDoRS(coordsRetirada)) return res.status(400).json({ erro: "Endereço de retirada precisa estar no RS" });
    if (!dentroDoRS(coordsDestino)) return res.status(400).json({ erro: "Endereço de destino precisa estar no RS" });

    const coordinates = [coordsCasa, coordsRetirada, coordsDestino];

    const response = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      { coordinates },
      { headers: { Authorization: apiKey, "Content-Type": "application/json" } }
    );

    if (!response.data.features || !response.data.features.length) throw new Error("Rota não encontrada");

    const km = response.data.features[0].properties.summary.distance / 1000;
    let preco = km < 5 ? 50 : km * 3.5;
    if (ajudante === "Sim") preco += 40;
    if (escada === "Sim") preco += 30;

    pedidos.push({ retirada, destino, ajudante, escada, km: km.toFixed(1), preco: preco.toFixed(2), data: new Date().toLocaleString() });

    res.json({ km: km.toFixed(1), preco: preco.toFixed(2) });
  } catch (err) {
    console.error("🔥 ERRO COMPLETO:", err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao calcular rota" });
  }
});

app.listen(3000, () => console.log("🚀 Servidor rodando em http://localhost:3000"));