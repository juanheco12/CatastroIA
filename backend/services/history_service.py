from sqlalchemy.orm import Session
from models.motivada import HistorialMotivada, EstadoMotivada


def crear_registro(db: Session, data, texto_motivada: str) -> HistorialMotivada:
    registro = HistorialMotivada(
        tipo_mutacion=getattr(data, "tipo_mutacion", "tercera_clase"),
        numero_expediente=data.numero_predial,
        numero_predio=data.numero_predial,
        propietario_nombre=getattr(data, "nombre_propietario", "") or "",
        propietario_documento=getattr(data, "cedula_propietario", "") or getattr(data, "cedula", "") or "-",
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


def listar_historial(db: Session, skip: int = 0, limit: int = 50, buscar: str | None = None):
    query = db.query(HistorialMotivada)
    if buscar:
        like = f"%{buscar}%"
        query = query.filter(
            HistorialMotivada.numero_expediente.ilike(like)
            | HistorialMotivada.propietario_nombre.ilike(like)
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
