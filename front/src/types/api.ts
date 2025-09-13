export interface Usuario {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  grupo?: number | null;
  rol?: string;
  uuid?: string;
}

export interface Grupo {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Asistencia {
  id: number;
  alumno: Usuario;
  fecha: string; // YYYY-MM-DD
  presente: boolean;
  nota?: string;
}

export interface SessionDay {
  id: number;
  grupo: Grupo;
  fecha: string;
  active: boolean;
}

export interface Pago {
  id: number;
  alumno: Usuario;
  fecha_pago: string;
  numero_referencia: string;
  tipo_transaccion: string;
  banco_emisor?: string | null;
  captura_comprobante?: string | null; // URL
}

export interface PageResult<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}
