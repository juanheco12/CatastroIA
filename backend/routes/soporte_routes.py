from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.soporte import SoporteInfoResponse
from services import soporte_service

router = APIRouter(prefix="/soportes", tags=["soportes"])

MAX_SOPORTE_SIZE = 15 * 1024 * 1024  # 15 MB
EXTENSIONES_VALIDAS = {"pdf", "docx", "txt"}


@router.post("/upload", response_model=SoporteInfoResponse)
async def upload_soporte(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Sube un documento de soporte (PDF/Word/texto) a la base de conocimiento permanente."""
    if not file.filename or "." not in file.filename:
        raise HTTPException(status_code=400, detail="Nombre de archivo inválido")

    extension = file.filename.rsplit(".", 1)[-1].lower()
    if extension not in EXTENSIONES_VALIDAS:
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .pdf, .docx o .txt")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_SOPORTE_SIZE:
        raise HTTPException(status_code=413, detail="El archivo supera el límite de 15 MB")

    try:
        return soporte_service.guardar_soporte(db, file_bytes, file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error guardando soporte: {exc}")


@router.get("/", response_model=list[SoporteInfoResponse])
def listar_soportes(db: Session = Depends(get_db)):
    return soporte_service.listar_soportes(db)


@router.delete("/{soporte_id}")
def eliminar_soporte(soporte_id: int, db: Session = Depends(get_db)):
    eliminado = soporte_service.eliminar_soporte(db, soporte_id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Soporte no encontrado")
    return {"mensaje": "Soporte eliminado correctamente"}
