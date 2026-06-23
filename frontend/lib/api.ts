import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Render's free tier puts the backend to sleep after inactivity; waking it
// up plus a large PDF extraction or LLM call can take well over a minute.
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 120000,
});

// Si el backend/proxy está despertando de un cold start, una respuesta 200
// a veces no trae JSON (p. ej. una página intermedia). axios no valida el
// shape de la respuesta, así que sin esto un body inesperado se propaga tal
// cual al estado de un componente y revienta en render (ej. items.map en
// HistoryPanel) en vez de mostrar el mensaje de error.
api.interceptors.response.use((response) => {
  const contentType = String(response.headers?.["content-type"] ?? "");
  if (!contentType.includes("application/json")) {
    return Promise.reject(new Error("El servidor respondió de forma inesperada. Intenta de nuevo en unos segundos."));
  }
  return response;
});

// Las funciones que devuelven listas asumen que res.data ya es un array;
// esto evita que un body malformado (cold start) llegue como string/objeto
// y rompa un .map() en el render de un componente.
function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

// FastAPI/Pydantic v2 manda errores de validación (422) como un array de
// objetos {type, loc, msg, ...}, no como un string. Si ese array se renderiza
// directamente (p. ej. setError(err.response.data.detail)), React revienta
// con "Objects are not valid as a React child" (error #31). Esta función
// siempre devuelve un string, sin importar la forma real de `detail`.
export function extractErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((d) => (typeof d === "string" ? d : (d as { msg?: string })?.msg))
      .filter(Boolean)
      .join("; ") || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

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
  const res = await api.post("/motivada/generar", data, { timeout: 180000 });
  // Render/Neon despertando de un cold start a veces deja pasar una respuesta
  // 200 que no es el JSON esperado (p. ej. una página de error del proxy).
  // Se valida la forma para no propagar un objeto roto que reviente el render.
  if (typeof res.data?.texto_motivada !== "string") {
    throw new Error("El servidor respondió de forma inesperada. Intenta de nuevo en unos segundos.");
  }
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
  return asArray<HistorialItem>(res.data);
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

export interface SoporteInfo {
  id: number;
  nombre_original: string;
  tipo_archivo: string;
  tamano_bytes: number;
  longitud_texto: number;
  fecha_subida: string;
}

export async function subirSoporte(file: File): Promise<SoporteInfo> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/soportes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 300000,
  });
  return res.data;
}

export async function extraerInformeTecnico(file: File): Promise<{ texto: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/motivada/extraer-informe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return res.data;
}

export async function listarSoportes(): Promise<SoporteInfo[]> {
  const res = await api.get("/soportes/");
  return asArray<SoporteInfo>(res.data);
}

export async function eliminarSoporte(id: number) {
  const res = await api.delete(`/soportes/${id}`);
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

// ── Biblioteca de motivadas reutilizables ──
// Modo estricto: estos endpoints nunca reescriben texto jurídico con IA.
// embed_texts() solo se usa para indexar/buscar por similitud (en el backend).

export const CATEGORIAS_MOTIVADA: { value: string; label: string }[] = [
  { value: "mutacion_primera_clase", label: "Mutación de primera clase" },
  { value: "mutacion_segunda_clase", label: "Mutación de segunda clase" },
  { value: "mutacion_tercera_clase", label: "Mutación de tercera clase" },
  { value: "mutacion_cuarta_clase", label: "Mutación de cuarta clase" },
  { value: "mutacion_quinta_clase", label: "Mutación de quinta clase" },
  { value: "cambio_referencia_catastral", label: "Cambio de referencia catastral" },
  { value: "cancelacion_inscripcion_catastral", label: "Cancelación de inscripción catastral" },
  { value: "rectificacion_general_datos", label: "Rectificación general de datos" },
  { value: "complementacion", label: "Complementación" },
];

// Mismos códigos que TipoOrigen en MutationSelector — se reutiliza tal cual
// para que "tipo_tramite_manual" funcione como filtro de origen tanto en el
// Formulario (flujo IA) como en la Biblioteca (flujo de plantillas reales).
export const ORIGENES_TRAMITE: { value: string; label: string }[] = [
  { value: "propietario", label: "Propietario" },
  { value: "autorizado", label: "Autorizado" },
  { value: "poder", label: "Con poder" },
  { value: "snr", label: "SNR" },
  { value: "oficio", label: "Oficio" },
];

export function labelOrigenTramite(origen: string | null | undefined): string {
  if (!origen) return "Sin especificar";
  return ORIGENES_TRAMITE.find((o) => o.value === origen)?.label ?? origen;
}

export const TIPOS_CAMPO_VARIABLE: { value: string; label: string }[] = [
  { value: "nombre_propietario", label: "Nombre del propietario" },
  { value: "direccion", label: "Dirección" },
  { value: "identificacion", label: "Identificación (CC/NIT)" },
  { value: "numero_predial", label: "Número predial" },
  { value: "matricula_inmobiliaria", label: "Matrícula inmobiliaria" },
  { value: "numero_resolucion", label: "Número de resolución" },
  { value: "radicado", label: "Radicado" },
  { value: "acto_administrativo", label: "Acto administrativo" },
  { value: "escritura", label: "Escritura" },
  { value: "oficina_registro", label: "Oficina de registro" },
  { value: "area", label: "Área" },
  { value: "fecha", label: "Fecha" },
  { value: "documentos_aportados", label: "Documentos aportados" },
  { value: "otro", label: "Otro" },
];

export function labelCategoria(categoria: string | null | undefined): string {
  if (!categoria) return "Sin categoría";
  return CATEGORIAS_MOTIVADA.find((c) => c.value === categoria)?.label ?? categoria;
}

export function labelTipoCampo(tipo: string): string {
  return TIPOS_CAMPO_VARIABLE.find((t) => t.value === tipo)?.label ?? tipo;
}

export interface CampoVariable {
  id: number;
  tipo_campo: string;
  texto_original: string;
  offset_inicio: number;
  offset_fin: number;
  tipo_identificacion?: string | null;
  origen_deteccion: string;
  confirmado: boolean;
}

export interface PlantillaInfo {
  id: number;
  nombre_original: string;
  categoria?: string | null;
  categorias_candidatas: string;
  estado: string;
  motivo_revision_pendiente?: string | null;
  tipo_tramite_manual?: string | null;
  tamano_bytes: number;
  contador_uso: number;
  fecha_ultimo_uso?: string | null;
  es_favorita: boolean;
  fecha_subida: string;
  fecha_revision?: string | null;
  revisado_por?: string | null;
}

export interface PlantillaDetalle extends PlantillaInfo {
  contenido_texto: string;
  campos: CampoVariable[];
}

export interface ItemIngesta {
  nombre_original: string;
  estado: string;
  categoria?: string | null;
  categorias_candidatas: string[];
  motivo_revision_pendiente?: string | null;
  plantilla_id?: number | null;
  error?: string | null;
}

export interface IngestaResumen {
  total_archivos: number;
  total_ingestados: number;
  total_errores: number;
  distribucion_categorias: Record<string, number>;
  total_casos_atipicos: number;
  items: ItemIngesta[];
}

export interface CampoManualInput {
  tipo_campo: string;
  texto_original: string;
  offset_inicio: number;
  offset_fin: number;
  tipo_identificacion?: string | null;
}

export interface AprobarPlantillaInput {
  categoria?: string | null;
  tipo_tramite_manual?: string | null;
  campos_confirmados_ids?: number[];
  campos_manuales?: CampoManualInput[];
  revisado_por?: string | null;
}

export interface NuevaVersionResponse {
  plantilla_id: number;
  numero_version_anterior: number;
  estado: string;
  mensaje: string;
}

export interface ResultadoBusqueda {
  plantilla: PlantillaInfo;
  score: number;
  razon?: string | null;
}

export interface BusquedaSemanticaResponse {
  encontrado: boolean;
  mejor?: ResultadoBusqueda | null;
  alternativas: ResultadoBusqueda[];
  mensaje?: string | null;
}

export interface CampoReemplazadoPreview {
  campo_id: number;
  tipo_campo: string;
  valor_anterior: string;
  valor_nuevo: string;
}

export interface PreviewGeneracionResponse {
  texto_previsto: string;
  campos_reemplazados: CampoReemplazadoPreview[];
  fundamento_legal?: string | null;
  parte_resolutiva?: string | null;
}

export interface GenerarFinalResponse {
  filename: string;
  content_base64: string;
  size_bytes: number;
}

export async function eliminarTodasPlantillas(): Promise<{ eliminadas: number }> {
  const res = await api.delete("/biblioteca/todas");
  return res.data;
}

export async function ingestarZipBiblioteca(file: File): Promise<IngestaResumen> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/biblioteca/ingestar-zip", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 300000,
  });
  return res.data;
}

export async function ingestarDocxBiblioteca(file: File): Promise<ItemIngesta> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/biblioteca/ingestar-docx", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 300000,
  });
  return res.data;
}

export async function nuevaVersionPlantilla(
  plantillaId: number,
  file: File,
  motivoCambio: string,
  cambiadoPor?: string
): Promise<NuevaVersionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("motivo_cambio", motivoCambio);
  if (cambiadoPor) formData.append("cambiado_por", cambiadoPor);
  const res = await api.post(`/biblioteca/${plantillaId}/nueva-version`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 300000,
  });
  return res.data;
}

export async function listarPlantillas(params?: {
  categoria?: string; estado?: string; tipo_tramite?: string; q?: string;
}): Promise<PlantillaInfo[]> {
  const res = await api.get("/biblioteca/", { params });
  return asArray<PlantillaInfo>(res.data);
}

export async function pendientesRevision(): Promise<PlantillaInfo[]> {
  const res = await api.get("/biblioteca/pendientes-revision");
  return asArray<PlantillaInfo>(res.data);
}

export async function masUsadasPlantillas(limite = 10): Promise<PlantillaInfo[]> {
  const res = await api.get("/biblioteca/mas-usadas", { params: { limite } });
  return asArray<PlantillaInfo>(res.data);
}

export async function buscarPlantillasPorFiltros(params: {
  categoria?: string; tipo_tramite?: string; keyword?: string;
}): Promise<PlantillaInfo[]> {
  const res = await api.get("/biblioteca/buscar", { params });
  return asArray<PlantillaInfo>(res.data);
}

export async function buscarPlantillaSemantica(
  descripcionCaso: string, categoria?: string
): Promise<BusquedaSemanticaResponse> {
  const res = await api.post("/biblioteca/buscar-semantica", {
    descripcion_caso: descripcionCaso,
    categoria: categoria || undefined,
  });
  return res.data;
}

export async function obtenerDetallePlantilla(id: number): Promise<PlantillaDetalle> {
  const res = await api.get(`/biblioteca/${id}`);
  return res.data;
}

export async function descargarPlantillaOriginal(id: number): Promise<GenerarFinalResponse> {
  const res = await api.get(`/biblioteca/${id}/descargar`);
  return res.data;
}

export async function eliminarPlantilla(id: number) {
  const res = await api.delete(`/biblioteca/${id}`);
  return res.data;
}

export async function aprobarPlantilla(id: number, data: AprobarPlantillaInput): Promise<PlantillaDetalle> {
  const res = await api.post(`/biblioteca/${id}/aprobar`, data);
  return res.data;
}

export async function marcarPlantillaAtipico(
  id: number, motivo: string, revisadoPor?: string
): Promise<PlantillaInfo> {
  const res = await api.post(`/biblioteca/${id}/marcar-atipico`, {
    motivo, revisado_por: revisadoPor,
  });
  return res.data;
}

export async function marcarPlantillaFavorita(id: number, favorita: boolean): Promise<PlantillaInfo> {
  const res = await api.post(`/biblioteca/${id}/favorito`, null, { params: { favorita } });
  return res.data;
}

export async function previewGeneracionPlantilla(
  id: number, valores: Record<number, string>, tipoTramiteManual?: string
): Promise<PreviewGeneracionResponse> {
  const res = await api.post(`/biblioteca/${id}/preview-generacion`, {
    valores, tipo_tramite_manual: tipoTramiteManual || undefined, aprobado: false,
  });
  return res.data;
}

export async function generarFinalPlantilla(
  id: number, valores: Record<number, string>, tipoTramiteManual?: string
): Promise<GenerarFinalResponse> {
  const res = await api.post(`/biblioteca/${id}/generar-final`, {
    valores, tipo_tramite_manual: tipoTramiteManual || undefined, aprobado: true,
  });
  return res.data;
}