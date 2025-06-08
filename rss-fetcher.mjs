import dotenv from "dotenv";
import Parser from "rss-parser";
import fetch from "node-fetch";
import fs from "fs";

dotenv.config();
const parser = new Parser();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function resumirComGemini(texto) {
  const prompt = `Resuma a notícia abaixo em até 3 linhas de forma objetiva e clara:\n\n${texto}`;

  const resposta = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await resposta.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao resumir.";
}

async function buscarNoticias() {
const feeds = [
  'https://ge.globo.com/rss/ceara/',
  'https://www.opovo.com.br/rss/ceara-sc.xml',
  'https://diariodonordeste.verdesmares.com.br/rss/esportes/futebol/times/ceara'
];

  const todasNoticias = [];

  for (const url of feeds) {
    const feed = await parser.parseURL(url);
    todasNoticias.push(...feed.items);
  }

  const primeiras20 = todasNoticias.slice(0, 20);

  let html = `<h1>📰 Últimas Notícias Resumidas - Ceará SC</h1><div class="noticias">`;

  for (const item of primeiras20) {
    const resumo = await resumirComGemini(item.contentSnippet || item.content || item.summary || item.title);

    html += `
    <div class="card">
      <h2>${item.title}</h2>
      <p>${resumo}</p>
      <a href="${item.link}" target="_blank">Ler completa</a>
    </div>
    `;
  }

  html += `</div>`;

  fs.writeFileSync("noticias.html", html, "utf8");
  console.log("✅ Arquivo noticias.html atualizado com sucesso.");
}

buscarNoticias().catch(console.error);
