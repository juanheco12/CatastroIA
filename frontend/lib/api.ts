import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

// Simplified form data — only what's needed
export interface TerceraClaseFormData {
  nombre_propietario: string;
  cedula: string;
  numero_predial: string;
  folio_matricula: string;
  area_construida_m2: number | string;
  area_terreno_m2: number | string;
  documentos_aportados: string[];
}

export interface MotivadaGeneradaResponse {
  texto_motivada: string;
  numero_expediente: string;
  propietario: string;
  tipo_mutacion: string;
  tokens_usados?: number;
  articulos_finales?: string;
}

export interface HistorialItem {
  id: number;
  fecha_creacion: string;
  tipo_mutacion: string;
  numero_expediente: string;
  numero_predio: string;
  propietario_nombre: string;
  propietario_documento: string;
  estado: string;
  archivo_exportado?: string;
}

export interface HistorialDetalle extends HistorialItem {
  texto_motivada: string;
  datos_formulario: string;
}

export async function generarMotivada(data: TerceraClaseFormData): Promise<MotivadaGeneradaResponse> {
  const res = await api.post("/motivada/generar", data);
  return res.data;
}

export async function exportarWord(
  formData: TerceraClaseFormData,
  textoMotivada: string
): Promise<{ filename: string; content_base64: string; size_bytes: number }> {
  const res = await api.post("/motivada/exportar-json", {
    form_data: formData,
    texto_motivada: textoMotivada,
  });
  return res.data;
}

export async function getTemplateInfo() {
  const res = await api.get("/template/info");
  return res.data;
}

export async function uploadTemplate(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/template/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getHistorial(params?: { buscar?: string; skip?: number; limit?: number }) {
  const res = await api.get("/historial/", { params });
  return res.data as HistorialItem[];
}

export async function getHistorialDetalle(id: number) {
  const res = await api.get(`/historial/${id}`);
  return res.data as HistorialDetalle;
}

export async function deleteHistorialItem(id: number) {
  const res = await api.delete(`/historial/${id}`);
  return res.data;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SugerenciaMotivada {
  tipo_mutacion: string;
  tipo_origen: string;
}

export async function enviarMensajeChat(
  mensaje: string,
  historial: ChatMessage[]
): Promise<{ respuesta: string; tokens_usados?: number; sugerencia?: SugerenciaMotivada | null }> {
  const res = await api.post("/chat/mensaje", { mensaje, historial });
  return res.data;
}

export function downloadBase64Docx(base64: string, filename: string) {
  const byteCharacters = atob(base64);
  const byteArray = new Uint8Array(Array.from(byteCharacters, (c) => c.charCodeAt(0)));
  const blob = new Blob([byteArray], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
