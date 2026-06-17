# CatIA — Generador de Motivadas Catastrales

Sistema IA para generar motivadas jurídicamente válidas para trámites de mutación catastral colombianos, usando Claude Sonnet como motor de redacción y python-docx para exportar a Word.

## Versión actual: Mutación Tercera Clase (Incorporación de Construcción)

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 + TypeScript + TailwindCSS |
| Backend | FastAPI + Python 3.10+ |
| IA | Claude Sonnet 4.6 (Anthropic) |
| Documentos | python-docx |
| Base de datos | SQLite (historial local) |

---

## Inicio rápido

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd CatastroIA
```

### 2. Configurar el Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
# .venv\Scripts\activate         # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env y poner tu clave ANTHROPIC_API_KEY=sk-ant-...

# Iniciar servidor
uvicorn main:app --reload --port 8000
```

El API quedará disponible en `http://localhost:8000`
Documentación interactiva en `http://localhost:8000/docs`

### 3. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Variables de entorno (opcional, ya tiene el valor por defecto)
cp .env.local.example .env.local

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación quedará disponible en `http://localhost:3000`

---

## Estructura del proyecto

```
CatastroIA/
├── backend/
│   ├── main.py                 # FastAPI app + rutas
│   ├── config.py               # Variables de entorno
│   ├── models/
│   │   └── motivada.py         # Modelo SQLAlchemy (historial)
│   ├── services/
│   │   ├── claude_service.py   # Integración Anthropic
│   │   ├── docx_service.py     # Generación Word
│   │   ├── template_service.py # Gestión templates
│   │   └── history_service.py  # CRUD SQLite
│   ├── routes/
│   │   ├── motivada_routes.py  # POST /motivada/generar
│   │   ├── template_routes.py  # POST /template/upload
│   │   └── history_routes.py   # GET /historial/
│   ├── schemas/
│   │   ├── tercera_clase.py    # Validación Pydantic
│   │   └── responses.py        # Tipos de respuesta
│   ├── database/
│   │   └── db.py               # SQLite + SQLAlchemy
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── layout.tsx          # Layout global
│   │   └── components/
│   │       ├── FormBuilder.tsx     # Formulario Tercera Clase
│   │       ├── PreviewMotivada.tsx # Vista previa + exportar
│   │       ├── HistoryPanel.tsx    # Historial SQLite
│   │       ├── TemplateUploader.tsx# Gestión templates
│   │       └── SettingsPanel.tsx   # Configuración
│   ├── lib/
│   │   └── api.ts              # Cliente Axios + tipos
│   └── styles/
│       └── globals.css         # Dark mode + utilidades
│
└── README.md
```

---

## Endpoints del API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servidor |
| POST | `/motivada/generar` | Genera motivada con Claude |
| POST | `/motivada/exportar-json` | Exporta a .docx (base64) |
| POST | `/template/upload` | Sube template Word |
| GET | `/template/info` | Info del template activo |
| GET | `/historial/` | Lista historial |
| GET | `/historial/{id}` | Detalle de registro |
| DELETE | `/historial/{id}` | Elimina registro |

---

## Template personalizado

Crea un archivo `.docx` con los siguientes marcadores y súbelo desde la pestaña "Template":

```
{{NUMERO_EXPEDIENTE}}    {{NUMERO_PREDIO}}
{{PROPIETARIO_NOMBRE}}   {{TIPO_DOCUMENTO}}
{{NUMERO_DOCUMENTO}}     {{DIRECCION_CONSTRUCCION}}
{{MUNICIPIO}}            {{AREA_CONSTRUIDA}}
{{ANIO_CONSTRUCCION}}    {{MATERIALES}}
{{INSPECTOR_RESPONSIBLE}} {{MOTIVADA}}
{{FECHA_SOLICITUD}}      {{DIA_RESOLUCION}}
{{MES_RESOLUCION}}       {{ANIO_RESOLUCION}}
```

Si no hay template personalizado, el sistema genera el documento con una plantilla interna.

---

## Roadmap

- **Fase 1 (actual):** MVP — formulario + Claude + exportar Word + historial
- **Fase 2:** Validaciones robustas, 5+ casos de prueba
- **Fase 3:** Múltiples tipos de mutación, deploy Vercel + Railway
- **Fase 4:** Chat con Resolución 1040, sugerencias automáticas

---

## Notas de arquitectura

- En desarrollo local, el historial se almacena en SQLite (`catia.db`); en producción se usa PostgreSQL (ver despliegue abajo)
- Los archivos exportados se guardan en `backend/exports/`
- El template activo y los documentos de soporte se guardan en la base de datos (no en el disco), para que sobrevivan a reinicios del servidor
- La clave Anthropic nunca sale del backend

---

## Despliegue en producción (Vercel + Render)

El frontend (Next.js) se despliega en **Vercel** y el backend (FastAPI + PostgreSQL) en **Render**, usando el archivo `render.yaml` de la raíz del repo (Render Blueprint).

### Backend en Render

1. Entra a [render.com](https://render.com) → **New** → **Blueprint** → conecta este repositorio de GitHub.
2. Render detecta `render.yaml` y crea automáticamente:
   - Una base de datos PostgreSQL gratuita (`catia-db`)
   - Un servicio web (`catia-backend`) apuntando a la carpeta `backend/`
3. Durante la creación te pedirá llenar las variables marcadas como secretas:
   - `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` y/o `GROQ_API_KEY` (al menos una)
   - `CORS_ORIGINS` — déjala en `http://localhost:3000` por ahora; se actualiza en el paso final con la URL real de Vercel
4. Una vez desplegado, copia la URL pública del backend (algo como `https://catia-backend.onrender.com`).

> El plan gratuito de Postgres en Render expira a los 90 días; pasado ese tiempo hay que migrar a un plan pago (~7 USD/mes) o crear una base nueva para seguir conservando el historial.
> El plan gratuito del servicio web "se duerme" tras ~15 minutos sin tráfico; la primera petición después de eso tarda unos segundos en responder.

### Frontend en Vercel

1. Entra a [vercel.com](https://vercel.com) → **Add New** → **Project** → importa este repositorio.
2. En **Root Directory** selecciona `frontend` (el repo tiene backend y frontend juntos).
3. En **Environment Variables** agrega:
   - `NEXT_PUBLIC_API_BASE_URL` = la URL del backend en Render (paso anterior)
4. Despliega. Vercel te da una URL pública, por ejemplo `https://catia-ia.vercel.app`.

### Conectar ambos

Vuelve a Render → tu servicio `catia-backend` → **Environment** → edita `CORS_ORIGINS` con la URL de Vercel (sin `/` al final), por ejemplo:

```
CORS_ORIGINS=https://catia-ia.vercel.app
```

Guarda y espera el redeploy automático. A partir de ahí la app funciona 100% en la nube, sin necesidad de correr nada en local.
