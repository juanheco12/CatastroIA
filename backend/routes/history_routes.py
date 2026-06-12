from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.responses import HistorialItemResponse, HistorialDetalleResponse
from services import history_service

router = APIRouter(prefix="/historial", tags=["historial"])


@router.get("/", response_model=list[HistorialItemResponse])
def listar_historial(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, le=200),
    buscar: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return history_service.listar_historial(db=db, skip=skip, limit=limit, buscar=buscar)


@router.get("/{registro_id}", response_model=HistorialDetalleResponse)
def obtener_registro(registro_id: int, db: Session = Depends(get_db)):
    registro = history_service.obtener_por_id(db, registro_id)
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return registro


@router.delete("/{registro_id}")
def eliminar_registro(registro_id: int, db: Session = Depends(get_db)):
    eliminado = history_service.eliminar_registro(db, registro_id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return {"mensaje": "Registro eliminado correctamente"}
