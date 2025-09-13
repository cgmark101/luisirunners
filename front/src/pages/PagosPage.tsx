import React, { useEffect, useState, useRef } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import { Modal } from "../components/ui/modal";
import Button from "../components/ui/button/Button";
import { FiChevronsLeft, FiChevronLeft, FiChevronRight, FiChevronsRight } from "react-icons/fi";
import { listPagos, createPago, updatePago, deletePago } from "../services/pago.service";
import { listUsers } from "../services/user.service";
import { Pago, Usuario, PageResult } from "../types/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, format } from 'date-fns';
import ComponentCard from "../components/common/ComponentCard";

const PAGE_SIZE = 25;

type PagoForm = {
  id?: number;
  alumno?: number | Usuario;
  fecha_pago?: string;
  numero_referencia?: string;
  tipo_transaccion?: string;
  banco_emisor?: string | null;
  captura_comprobante?: string | null;
  captura_comprobante_file?: File | null;
};

const PagosPage: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [alumnos, setAlumnos] = useState<Usuario[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<null | Pago>(null);
  const [showDelete, setShowDelete] = useState<null | Pago>(null);
  const [form, setForm] = useState<PagoForm>({});
  const [alumnoQuery, setAlumnoQuery] = useState("");
  const [alumnoSuggestions, setAlumnoSuggestions] = useState<Usuario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputAddRef = useRef<HTMLInputElement | null>(null);
  const fileInputEditRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLoading(true);
    listPagos({ page, page_size: PAGE_SIZE })
      .then((res: PageResult<Pago>) => {
        setPagos(res.results);
        setTotal(res.count);
      })
      .catch(() => setError("Error cargando pagos"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    listUsers({ page: 1, page_size: 1000 })
      .then((res: PageResult<Usuario>) => setAlumnos(res.results || []))
      .catch(() => setAlumnos([]));
  }, []);

  const getAlumnoName = (p: Pago) => {
    // alumno may be a nested object or an id depending on API
  const alumnoRaw = p as unknown as { alumno?: number | Usuario };
  const alumno = alumnoRaw.alumno;
    if (!alumno) return "-";
    if (typeof alumno === "number") {
      const found = alumnos.find((a) => a.id === alumno);
      return found ? `${found.first_name || ''} ${found.last_name || ''}`.trim() : String(alumno);
    }
    // assume object
    return `${alumno.first_name || ''} ${alumno.last_name || ''}`.trim() || '-';
  };

  const TIPO_CHOICES: [string, string][] = [
    ["PAGO_MOVIL", "Pago Móvil"],
    ["TRANSFERENCIA", "Transferencia Bancaria"],
    ["DEPOSITO", "Depósito Bancario"],
    ["EFECTIVO", "Efectivo"],
    ["ZELLE", "Zelle"],
    ["BINANCE", "Binance"],
    ["PAYPAL", "PayPal"],
    ["OTRO", "Otro"],
  ];

  const BANCOS_CHOICES: [string, string][] = [
    ["0001", "0001 - Banco Central de Venezuela"],
    ["0102", "0102 - Banco de Venezuela, S.A. Banco Universal"],
    ["0104", "0104 - Banco Venezolano de Crédito, S.A. Banco Universal"],
    ["0105", "0105 - Banco Mercantil C.A., Banco Universal"],
    ["0108", "0108 - Banco Provincial, S.A. Banco Universal"],
    ["0114", "0114 - Banco del Caribe C.A., Banco Universal"],
    ["0115", "0115 - Banco Exterior C.A., Banco Universal"],
    ["0128", "0128 - Banco Caroní C.A., Banco Universal"],
    ["0134", "0134 - Banesco Banco Universal, C.A."],
    ["0137", "0137 - Banco Sofitasa Banco Universal, C.A."],
    ["0138", "0138 - Banco Plaza, Banco Universal"],
    ["0146", "0146 - Banco de la Gente Emprendedora C.A."],
    ["0151", "0151 - Banco Fondo Común, C.A Banco Universal"],
    ["0156", "0156 - 100% Banco, Banco Comercial, C.A"],
    ["0157", "0157 - DelSur, Banco Universal C.A."],
    ["0163", "0163 - Banco del Tesoro C.A., Banco Universal"],
    ["0166", "0166 - Banco Agrícola de Venezuela C.A., Banco Universal"],
    ["0168", "0168 - Bancrecer S.A., Banco Microfinanciero"],
    ["0169", "0169 - Mi Banco, Banco Microfinanciero, C.A."],
    ["0171", "0171 - Banco Activo C.A., Banco Universal"],
    ["0172", "0172 - Bancamiga Banco Universal, C.A."],
    ["0173", "0173 - Banco Internacional de Desarrollo C.A., Banco Universal"],
    ["0174", "0174 - Banplus Banco Universal, C.A."],
    ["0175", "0175 - Banco Bicentenario del Pueblo, Banco Universal C.A."],
    ["0177", "0177 - Banco de la Fuerza Armada Nacional Bolivariana, B.U."],
    ["0178", "0178 - N58 Banco Digital, Banco Microfinanciero"],
    ["0191", "0191 - Banco Nacional de Crédito C.A., Banco Universal"],
    ["0601", "0601 - Instituto Municipal de Crédito Popular"],
  ];

  const getBancoLabel = (code?: string | null) => {
    if (!code) return "-";
    const found = BANCOS_CHOICES.find((b) => b[0] === code);
    return found ? found[1] : code;
  };

  const getTipoLabel = (code?: string) => {
    if (!code) return "-";
    const found = TIPO_CHOICES.find((c) => c[0] === code);
    return found ? found[1] : code;
  };

  useEffect(() => {
    const m = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(m.matches);
    update();
    if (m.addEventListener) m.addEventListener("change", update);
    else m.addListener(update);
    return () => {
      if (m.removeEventListener) m.removeEventListener("change", update);
      else m.removeListener(update);
    };
  }, []);

  const handleAdd = async () => {
    // form expected to include alumno (id), fecha_pago, numero_referencia, tipo_transaccion
    const fd = new FormData();
  // alumno can be id (number) or Usuario
  const alumnoId = typeof form.alumno === 'number' ? form.alumno : (form.alumno as Usuario | undefined)?.id;
  if (!alumnoId) return;
  fd.append("alumno", String(alumnoId));
    if (form.fecha_pago) fd.append("fecha_pago", String(form.fecha_pago));
    if (form.numero_referencia) fd.append("numero_referencia", String(form.numero_referencia));
    if (form.tipo_transaccion) fd.append("tipo_transaccion", String(form.tipo_transaccion));
  if (form.banco_emisor) fd.append("banco_emisor", String(form.banco_emisor));
  if (form.captura_comprobante_file) fd.append("captura_comprobante", form.captura_comprobante_file);

    setLoading(true);
    try {
      await createPago(fd);
      setShowAdd(false);
      setForm({});
      setPage(1);
    } catch {
      setError("Error creando pago");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!showEdit) return;
    const fd = new FormData();
    if (form.fecha_pago) fd.append("fecha_pago", String(form.fecha_pago));
    if (form.numero_referencia) fd.append("numero_referencia", String(form.numero_referencia));
    if (form.tipo_transaccion) fd.append("tipo_transaccion", String(form.tipo_transaccion));
    if (form.banco_emisor) fd.append("banco_emisor", String(form.banco_emisor));
  if (form.captura_comprobante_file) fd.append("captura_comprobante", form.captura_comprobante_file);

    setLoading(true);
    try {
      await updatePago(showEdit.id, fd);
      setShowEdit(null);
      setForm({});
      // refetch
      const res = await listPagos({ page, page_size: PAGE_SIZE });
      setPagos(res.results);
      setTotal(res.count);
    } catch {
      setError("Error editando pago");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setLoading(true);
    try {
      await deletePago(showDelete.id);
      const newTotal = Math.max(0, total - 1);
      const lastPage = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      const newPage = Math.min(page, lastPage);
      setShowDelete(null);
      setTotal(newTotal);
      if (newPage !== page) setPage(newPage);
      else {
        const res = await listPagos({ page: newPage, page_size: PAGE_SIZE });
        setPagos(res.results);
        setTotal(res.count);
      }
    } catch {
      setError("Error eliminando pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
        <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Pagos</h1>
        <Button onClick={() => { setForm({}); setAlumnoQuery(''); setAlumnoSuggestions([]); setShowAdd(true); }}>Agregar pago</Button>
      </div>

      {error && <div className="mb-2 text-red-600">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">#</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Alumno</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Referencia</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Banco</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tipo</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {pagos.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-5 py-4 font-medium text-gray-500 dark:text-gray-400 dark:bg-white/[0.03] bg-white">No hay pagos registrados.</TableCell>
                    <TableCell className="px-5 py-4 dark:bg-white/[0.03] bg-white">""</TableCell>
                    <TableCell className="px-5 py-4 dark:bg-white/[0.03] bg-white">""</TableCell>
                    <TableCell className="px-5 py-4 dark:bg-white/[0.03] bg-white">""</TableCell>
                    <TableCell className="px-5 py-4 dark:bg-white/[0.03] bg-white">""</TableCell>
                    <TableCell className="px-5 py-4 dark:bg-white/[0.03] bg-white">""</TableCell>
                  </TableRow>
                ) : (
                  pagos.map((p, idx) => (
                    <TableRow key={p.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-800 text-theme-sm dark:text-white/90">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-800 text-theme-sm dark:text-white/90">{getAlumnoName(p)}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">{p.fecha_pago}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">{p.numero_referencia}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">{getBancoLabel((p as Pago & { banco_emisor?: string | null }).banco_emisor)}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">{getTipoLabel(p.tipo_transaccion)}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <button
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-200 transition w-full sm:w-auto"
                            onClick={() => { setShowEdit(p); setForm(p); }}
                          >
                            Editar
                          </button>
                          <button
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium sm:ml-2 bg-red-50/80 dark:bg-red-400/10 text-red-600 border border-red-400 hover:bg-red-100 dark:hover:bg-red-400/20 transition w-full sm:w-auto"
                            onClick={() => setShowDelete(p)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* pagination - reuse Atletas pagination logic */}
      <div className="flex justify-center mt-4 gap-1 items-center">
        {(() => {
          const totalPages = Math.ceil(total / PAGE_SIZE);
          if (totalPages <= 1) return null;
          const pages: (number | string)[] = [];
          const add = (n: number | string) => pages.push(n);
          const neighborRange = isMobile ? 2 : 3;
          add(1);
          if (page > 2 + neighborRange) add("...");
          for (let i = Math.max(2, page - neighborRange); i <= Math.min(totalPages - 1, page + neighborRange); i++) add(i);
          if (page < totalPages - (1 + neighborRange)) add("...");
          if (totalPages > 1) add(totalPages);

          return (
            <>
              {isMobile ? (
                <div className="flex flex-col items-center w-full">
                  <div className="flex flex-wrap justify-center gap-0.5 items-center w-full mb-2">
                    {pages.map((p, idx) => typeof p === "number" ? (
                      <Button key={p} size="sm" variant={page === p ? "primary" : "outline"} className="mx-0.5 px-2 py-0.5 border-gray-200 shadow-sm" onClick={() => setPage(p)}>{p}</Button>
                    ) : (
                      <span key={"ellipsis-" + idx} className="px-2 text-gray-400 select-none">...</span>
                    ))}
                  </div>
                  <div className="flex justify-center gap-0.5 items-center w-full">
                    <Button size="sm" variant="outline" className="mx-0.5 px-2 py-0.5 border-gray-200 shadow-sm" onClick={() => setPage(1)} disabled={page === 1} aria-label="Primera página"><FiChevronsLeft className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" className="mx-0.5 px-2 py-0.5 border-gray-200 shadow-sm" onClick={() => setPage(page - 1)} disabled={page === 1} aria-label="Anterior"><FiChevronLeft className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" className="mx-0.5 px-2 py-0.5 border-gray-200 shadow-sm" onClick={() => setPage(page + 1)} disabled={page === totalPages} aria-label="Siguiente"><FiChevronRight className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" className="mx-0.5 px-2 py-0.5 border-gray-200 shadow-sm" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Última página"><FiChevronsRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button size="sm" variant="outline" className="mx-1 px-2" onClick={() => setPage(1)} disabled={page === 1} aria-label="Primera página"><FiChevronsLeft className="w-5 h-5" /></Button>
                  <Button size="sm" variant="outline" className="mx-1 px-2" onClick={() => setPage(page - 1)} disabled={page === 1} aria-label="Anterior"><FiChevronLeft className="w-5 h-5" /></Button>
                  {pages.map((p, idx) => typeof p === "number" ? (
                    <Button key={p} size="sm" variant={page === p ? "primary" : "outline"} className="mx-1" onClick={() => setPage(p)}>{p}</Button>
                  ) : (
                    <span key={"ellipsis-" + idx} className="px-2 text-gray-400 select-none">...</span>
                  ))}
                  <Button size="sm" variant="outline" className="mx-1 px-2" onClick={() => setPage(page + 1)} disabled={page === totalPages} aria-label="Siguiente"><FiChevronRight className="w-5 h-5" /></Button>
                  <Button size="sm" variant="outline" className="mx-1 px-2" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Última página"><FiChevronsRight className="w-5 h-5" /></Button>
                </>
              )}
            </>
          );
        })()}
      </div>

      {/* Modal agregar */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}>
        <ComponentCard title="Agregar pago" desc="Rellena los campos para crear un nuevo pago.">
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alumno</label>
                <input
                  placeholder="Busca atleta"
                  className="w-full px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500"
                  value={alumnoQuery}
                  onChange={e => {
                    const q = e.target.value;
                    setAlumnoQuery(q);
                    if (!q) setAlumnoSuggestions([]);
                    else setAlumnoSuggestions(alumnos.filter(a => `${a.first_name} ${a.last_name}`.toLowerCase().includes(q.toLowerCase())));
                  }}
                />
                {alumnoSuggestions.length > 0 && (
                  <ul className="border border-gray-200 rounded-md bg-white dark:bg-gray-800 max-h-40 overflow-auto mt-2">
                    {alumnoSuggestions.map(a => (
                      <li key={a.id} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => { setForm(f => ({ ...f, alumno: a.id })); setAlumnoQuery(`${a.first_name} ${a.last_name}`); setAlumnoSuggestions([]); }}>{a.first_name} {a.last_name}</li>
                    ))}
                  </ul>
                )}
                {!alumnoQuery && form.alumno && (
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">Seleccionado: {typeof form.alumno === 'number' ? (alumnos.find(a => a.id === form.alumno)?.first_name ?? '') + ' ' + (alumnos.find(a => a.id === form.alumno)?.last_name ?? '') : `${(form.alumno as Usuario).first_name} ${(form.alumno as Usuario).last_name}`}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha pago</label>
                <div>
                  <DatePicker
                    selected={form.fecha_pago ? parseISO(form.fecha_pago) : null}
                    onChange={(d: Date | null) => setForm(f => ({ ...f, fecha_pago: d ? format(d, 'yyyy-MM-dd') : '' }))}
                    className="w-full px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500"
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Seleccionar fecha"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de referencia</label>
                <input className="w-full px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500" value={form.numero_referencia || ''} onChange={e => setForm(f => ({ ...f, numero_referencia: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo transacción</label>
                <select className="w-full px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500" value={form.tipo_transaccion || ''} onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, tipo_transaccion: val, banco_emisor: (val === 'PAGO_MOVIL' || val === 'TRANSFERENCIA' || val === 'DEPOSITO') ? f.banco_emisor : null }));
                }}>
                  <option value="">Seleccionar tipo</option>
                  {TIPO_CHOICES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              {(form.tipo_transaccion === 'PAGO_MOVIL' || form.tipo_transaccion === 'TRANSFERENCIA' || form.tipo_transaccion === 'DEPOSITO') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banco emisor</label>
                  <select className="w-full px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500" value={form.banco_emisor || ''} onChange={e => setForm(f => ({ ...f, banco_emisor: e.target.value || null }))}>
                    <option value="">Sin banco</option>
                    {BANCOS_CHOICES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Captura comprobante</label>
                <input ref={fileInputAddRef} type="file" className="hidden" onChange={e => setForm(f => ({ ...f, captura_comprobante_file: e.target.files?.[0] }))} />
                <div className="flex items-center gap-3">
                  <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={() => fileInputAddRef.current?.click()}>Elegir archivo</button>
                  <div className="text-sm text-gray-700 dark:text-gray-300">{form.captura_comprobante_file ? form.captura_comprobante_file.name : 'No se ha seleccionado ningún archivo'}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <Button className="w-full sm:w-auto" onClick={handleAdd}>Crear</Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowAdd(false)}>Cancelar</Button>
            </div>
          </div>
        </ComponentCard>
      </Modal>

      {/* Modal editar */}
      <Modal isOpen={!!showEdit} onClose={() => { setShowEdit(null); setForm({}); }}>
        <ComponentCard title="Editar pago" desc="Actualiza los campos del pago seleccionado.">
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alumno</label>
                <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">{typeof form.alumno === 'number' ? (alumnos.find(a => a.id === form.alumno)?.first_name ?? '') + ' ' + (alumnos.find(a => a.id === form.alumno)?.last_name ?? '') : `${(form.alumno as Usuario)?.first_name || ''} ${(form.alumno as Usuario)?.last_name || ''}`}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha pago</label>
                <div>
                  <DatePicker
                    selected={form.fecha_pago ? parseISO(form.fecha_pago) : null}
                    onChange={(d: Date | null) => setForm(f => ({ ...f, fecha_pago: d ? format(d, 'yyyy-MM-dd') : '' }))}
                    className="w-full px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500"
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Seleccionar fecha"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de referencia</label>
                <input className="w-full px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500" value={form.numero_referencia || ''} onChange={e => setForm(f => ({ ...f, numero_referencia: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo transacción</label>
                <select className="w-full px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500" value={form.tipo_transaccion || ''} onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, tipo_transaccion: val, banco_emisor: (val === 'PAGO_MOVIL' || val === 'TRANSFERENCIA' || val === 'DEPOSITO') ? f.banco_emisor : null }));
                }}>
                  <option value="">Seleccionar tipo</option>
                  {TIPO_CHOICES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              {(form.tipo_transaccion === 'PAGO_MOVIL' || form.tipo_transaccion === 'TRANSFERENCIA' || form.tipo_transaccion === 'DEPOSITO') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banco emisor</label>
                  <select className="w-full px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500" value={form.banco_emisor || ''} onChange={e => setForm(f => ({ ...f, banco_emisor: e.target.value || null }))}>
                    <option value="">Sin banco</option>
                    {BANCOS_CHOICES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Captura comprobante</label>
                <input ref={fileInputEditRef} type="file" className="hidden" onChange={e => setForm(f => ({ ...f, captura_comprobante_file: e.target.files?.[0] }))} />
                <div className="flex items-center gap-3">
                  <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={() => fileInputEditRef.current?.click()}>Elegir archivo</button>
                  <div className="text-sm text-gray-700 dark:text-gray-300">{form.captura_comprobante_file ? form.captura_comprobante_file.name : 'No se ha seleccionado ningún archivo'}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <Button className="w-full sm:w-auto" onClick={handleEdit}>Guardar</Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setShowEdit(null); setForm({}); }}>Cancelar</Button>
            </div>
          </div>
        </ComponentCard>
      </Modal>

      {/* Modal eliminar */}
      <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)}>
        <ComponentCard title="Eliminar pago" desc={`¿Eliminar pago ${showDelete?.numero_referencia || ''}? Esta acción no se puede deshacer.`}>
          <div>
            <p className="text-sm text-red-700 dark:text-red-200">Esta operación eliminará permanentemente el pago seleccionado.</p>
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <Button variant="outline" className="text-red-600 border-red-400 hover:bg-red-50 dark:hover:bg-red-700/60" onClick={handleDelete}>Confirmar</Button>
              <Button variant="outline" onClick={() => setShowDelete(null)}>Cancelar</Button>
            </div>
          </div>
        </ComponentCard>
      </Modal>

    </div>
  );
};

export default PagosPage;
