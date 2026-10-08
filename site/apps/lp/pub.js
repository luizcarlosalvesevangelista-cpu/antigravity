/* Acesso leve ao Firestore pela API REST (sem SDK) para as páginas públicas: vendas (planos e interessados) e agenda online.
   As regras (portal/firestore.rules) definem o que um visitante sem login pode ler e gravar. */
const P = "upecriativo-cc472", KEY = "AIzaSyDJqqSMLWZLKSt9K1jPzvvQgyikZy4q9vw";
const BASE = `projects/${P}/databases/(default)/documents`, API = `https://firestore.googleapis.com/v1/${BASE}`;
const dec = v => v == null ? null : "stringValue" in v ? v.stringValue : "integerValue" in v ? +v.integerValue : "doubleValue" in v ? v.doubleValue : "booleanValue" in v ? v.booleanValue
  : "mapValue" in v ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)])) : "arrayValue" in v ? (v.arrayValue.values || []).map(dec) : "nullValue" in v ? null : "timestampValue" in v ? v.timestampValue : null;
export const enc = v => v === null || v === undefined ? { nullValue: null } : typeof v === "boolean" ? { booleanValue: v } : typeof v === "number" ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
  : Array.isArray(v) ? { arrayValue: { values: v.map(enc) } } : typeof v === "object" ? { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } } : { stringValue: String(v) };
const campos = d => Object.fromEntries(Object.entries(d).map(([k, x]) => [k, enc(x)]));
const docDe = j => ({ id: j.name.split("/").pop(), ...Object.fromEntries(Object.entries(j.fields || {}).map(([k, x]) => [k, dec(x)])) });

export async function ler(caminho) { const r = await fetch(`${API}/${caminho}?key=${KEY}`); if (!r.ok) return null; return docDe(await r.json()); }
export async function listar(col) { const r = await fetch(`${API}/${col}?key=${KEY}&pageSize=300`); if (!r.ok) return []; const j = await r.json(); return (j.documents || []).map(docDe); }
/* consulta numa subcoleção: pai = "agenda_paginas/x", col = "slots", filtros = [[campo, op, valor]] com op GREATER_THAN_OR_EQUAL, EQUAL… */
export async function consultar(pai, col, filtros = []) {
  const where = filtros.length ? { compositeFilter: { op: "AND", filters: filtros.map(([f, op, v]) => ({ fieldFilter: { field: { fieldPath: f }, op, value: enc(v) } })) } } : undefined;
  const r = await fetch(`${API}/${pai}:runQuery?key=${KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: col }], ...(where ? { where } : {}) } }) });
  if (!r.ok) return []; return (await r.json()).filter(x => x.document).map(x => docDe(x.document));
}
export async function criar(col, dados) {
  const r = await fetch(`${API}/${col}?key=${KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: campos(dados) }) });
  if (!r.ok) throw new Error("Não foi possível enviar agora. Tente de novo."); return true;
}
/* grava vários documentos de uma vez; "novo: true" exige que o documento ainda não exista (horário livre) */
export async function gravarJuntos(lista) {
  const writes = lista.map(({ caminho, dados, novo }) => ({ update: { name: `${BASE}/${caminho}`, fields: campos(dados) }, ...(novo ? { currentDocument: { exists: false } } : {}) }));
  const r = await fetch(`https://firestore.googleapis.com/v1/${BASE}:commit?key=${KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ writes }) });
  if (!r.ok) { const e = new Error("conflito"); e.status = r.status; throw e; } return true;
}
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const brl = v => (+v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
