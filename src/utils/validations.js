// Utilidades de validación de negocio para el condominio
// Estas funciones son puras y no dependen del DOM.

// Determina si una expensa está vencida
export function esVencida(expensa) {
  if (!expensa) return false;
  const fecha = new Date(expensa.fecha_vencimiento || expensa.vencimiento);
  if (isNaN(fecha.getTime())) return false;
  return (expensa.estado?.toLowerCase() === 'pendiente') && fecha < new Date();
}

// Calcula meses en mora: cuenta meses distintos de expensas vencidas pendientes
// Asume que expensa.periodo o fecha_generacion permiten derivar mes
export function mesesEnMora(expensas = []) {
  const set = new Set();
  expensas.forEach(e => {
    if (esVencida(e)) {
      const d = new Date(e.periodo || e.fecha_generacion || e.created_at);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        set.add(key);
      }
    }
  });
  return set.size;
}

// Verifica conflicto de horarios entre una reserva y existentes del mismo área
export function validarReservaConflicto(nueva, existentes = []) {
  if (!nueva?.hora_inicio || !nueva?.hora_fin) return false;
  const ini = new Date(`${nueva.fecha}T${nueva.hora_inicio}`);
  const fin = new Date(`${nueva.fecha}T${nueva.hora_fin}`);
  if (fin <= ini) return 'Rango horario inválido';
  for (const r of existentes) {
    if (r.area !== nueva.area) continue;
    const ri = new Date(`${r.fecha}T${r.hora_inicio}`);
    const rf = new Date(`${r.fecha}T${r.hora_fin}`);
    const overlap = (ini < rf) && (fin > ri);
    if (overlap) return 'Conflicto con otra reserva';
  }
  return false;
}

// Verifica si el horario cae dentro del horario permitido del área
export function dentroHorarioArea(reserva, area) {
  if (!area) return true;
  const apertura = area.hora_apertura || '00:00';
  const cierre = area.hora_cierre || '23:59';
  if (!reserva?.hora_inicio || !reserva?.hora_fin) return true;
  return reserva.hora_inicio >= apertura && reserva.hora_fin <= cierre;
}

// Verifica capacidad (invitados + anfitrión) contra el máximo del área
export function sobrepasaCapacidad(reserva, area) {
  if (!area?.capacidad_maxima) return false;
  const invitados = Array.isArray(reserva.invitados) ? reserva.invitados.length : (reserva.invitados_count || 0);
  return (invitados + 1) > area.capacidad_maxima; // +1 anfitrión
}

export default {
  esVencida,
  mesesEnMora,
  validarReservaConflicto,
  dentroHorarioArea,
  sobrepasaCapacidad
};
