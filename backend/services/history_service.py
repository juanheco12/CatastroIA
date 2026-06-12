import json
from datetime import datetime
from sqlalchemy.orm import Session
from models.motivada import HistorialMotivada, EstadoMotivada, TipoMutacion
from schemas.tercera_clase import TerceraClaseInput


def crear_registro(
    db: Session,
    data: TerceraClaseInput,
    texto_motivada: str,
) -> HistorialMotivada:
    registro = HistorialMotivada(
        tipo_mutacion=TipoMutacion.TERCERA_CLASE,
        numero_expediente=data.numero_expediente,
        numero_predio=data.numero_predio,
        propietario_nombre=data.propietario.nombre_completo,
        propietario_documento=data.propietario.numero_documento,
        texto_motivada=texto_motivada,
        datos_formulario=data.model_dump_json(),
        estado=EstadoMotivada.GENERADA,
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro


def marcar_exportado(db: Session, registro_id: int, nombre_archivo: str) -> HistorialMotivada | None:
    registro = db.query(HistorialMotivada).filter(HistorialMotivada.id == registro_id).first()
    if not registro:
        return None
    registro.archivo_exportado = nombre_archivo
    registro.estado = EstadoMotivada.EXPORTADA
    db.commit()
    db.refresh(registro)
    return registro


def listar_historial(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    buscar: str | None = None,
) -> list[HistorialMotivada]:
    query = db.query(HistorialMotivada)
    if buscar:
        like = f"%{buscar}%"
        query = query.filter(
            HistorialMotivada.numero_expediente.ilike(like)
            | HistorialMotivada.propietario_nombre.ilike(like)
            | HistorialMotivada.numero_predio.ilike(like)
        )
    return query.order_by(HistorialMotivada.fecha_creacion.desc()).offset(skip).limit(limit).all()


def obtener_por_id(db: Session, registro_id: int) -> HistorialMotivada | None:
    return db.query(HistorialMotivada).filter(HistorialMotivada.id == registro_id).first()


def eliminar_registro(db: Session, registro_id: int) -> bool:
    registro = db.query(HistorialMotivada).filter(HistorialMotivada.id == registro_id).first()
    if not registro:
        return False
    db.delete(registro)
    db.commit()
    return True
