import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000, // Claude can take a moment
});

export interface PropietarioInput {
  nombre_completo: string;
  tipo_documento: string;
  numero_documento: string;
  direccion?: string;
  telefono?: string;
}

export interface ConstruccionInput {
  direccion: string;
  municipio: string;
  departamento: string;
  area_construida_m2: number;
  descripcion: string;
  anio_construccion: number;
  numero_pisos: number;
  materiales_predominantes: string;
  uso_construccion: string;
  destino_economico: string;
}

export interface TerceraClaseFormData {
  numero_expediente: string;
  numero_predio: string;
  matricula_inmobiliaria?: string;
  propietario: PropietarioInput;
  construccion: ConstruccionInput;
  fecha_solicitud: string;
  fecha_visita_tecnica?: string;
  inspector_responsable: string;
  cargo_inspector: string;
  documentos_presentados: string[];
  observaciones_tecnicas?: string;
  observaciones_adicionales?: string;
}

export interface MotivadaGeneradaResponse {
  texto_motivada: string;
  numero_expediente: string;
  propietario: string;
  tipo_mutacion: string;
  tokens_usados?: number;
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

// --- API calls ---

export async function generarMotivada(
  data: TerceraClaseFormData
): Promise<MotivadaGeneradaResponse> {
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

export function downloadBase64Docx(base64: string, filename: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = Array.from(byteCharacters, (c) => c.charCodeAt(0));
  const byteArray = new Uint8Array(byteNumbers);
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
