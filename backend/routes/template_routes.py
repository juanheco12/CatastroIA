from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.responses import TemplateInfoResponse
from services import template_service

router = APIRouter(prefix="/template", tags=["template"])

MAX_TEMPLATE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", response_model=TemplateInfoResponse)
async def upload_template(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Accepts a .docx template and stores it in the database."""
    if not file.filename or not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .docx")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_TEMPLATE_SIZE:
        raise HTTPException(status_code=413, detail="El archivo supera el límite de 10 MB")

    try:
        meta = template_service.save_template(db, file_bytes, file.filename)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error guardando template: {exc}")

    return TemplateInfoResponse(
        nombre=meta["nombre_original"],
        campos_detectados=meta["campos_detectados"],
        tamano_bytes=meta["tamano_bytes"],
        fecha_subida=meta["fecha_subida"],
        existe=True,
    )


@router.get("/info", response_model=TemplateInfoResponse)
def get_template_info(db: Session = Depends(get_db)):
    """Returns metadata about the currently stored template."""
    info = template_service.get_template_info(db)
    return TemplateInfoResponse(**info)


@router.get("/campos")
def get_template_campos(db: Session = Depends(get_db)):
    """Returns the list of {{FIELD}} placeholders found in the active template."""
    info = template_service.get_template_info(db)
    return {"campos": info.get("campos_detectados", []), "existe_template": info.get("existe", False)}
