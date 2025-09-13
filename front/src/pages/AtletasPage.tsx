import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import { Modal } from "../components/ui/modal";
import Button from "../components/ui/button/Button";
import { FiChevronsLeft, FiChevronLeft, FiChevronRight, FiChevronsRight } from "react-icons/fi";
import { listUsers, createUser, updateUser, deleteUser } from "../services/user.service";
import { listGrupos } from "../services/grupo.service";
import { Usuario, Grupo, PageResult } from "../types/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ComponentCard from "../components/common/ComponentCard";

const PAGE_SIZE = 25;

const AtletasPage: React.FC = () => {
  const [atletas, setAtletas] = useState<Usuario[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<null | Usuario>(null);
  const [showDelete, setShowDelete] = useState<null | Usuario>(null);
  const [form, setForm] = useState<Partial<Usuario>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch atletas
  useEffect(() => {
    setLoading(true);
    listUsers({ page, page_size: PAGE_SIZE })
      .then((res: PageResult<Usuario>) => {
        setAtletas(res.results);
        setTotal(res.count);
      })
      .catch(() => setError("Error cargando atletas"))
      .finally(() => setLoading(false));
  }, [page]);

  // Fetch grupos
  useEffect(() => {
    listGrupos()
      .then((res: PageResult<Grupo> | Grupo[]) => {
        if (Array.isArray(res)) setGrupos(res);
        else if (res && Array.isArray(res.results)) setGrupos(res.results);
        else setGrupos([]);
      })
      .catch(() => setGrupos([]));
  }, []);

  // Detect mobile to adapt pagination (1 neighbor on mobile, 2 on desktop)
  useEffect(() => {
    const m = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(m.matches);
    update();
    if (m.addEventListener) m.addEventListener('change', update);
    else m.addListener(update);
    return () => {
      if (m.removeEventListener) m.removeEventListener('change', update);
      else m.removeListener(update);
    };
  }, []);

  // Handlers
  const handleAdd = async () => {
    if (!form.first_name || !form.last_name || !form.grupo) return;
    setLoading(true);
    try {
      // Ensure required fields for backend: username is required by the model/serializer
      const makeUsername = () => {
        const fn = (form.first_name || '').trim().toLowerCase().replace(/\s+/g, '');
        const ln = (form.last_name || '').trim().toLowerCase().replace(/\s+/g, '');
        const suffix = String(Date.now()).slice(-4);
        return fn || ln ? `${fn || 'user'}.${ln || 'anon'}${suffix}` : `user${suffix}`;
      };

      const payload = {
        ...form,
        username: form.username || makeUsername(),
      };

      await createUser(payload);
      setShowAdd(false);
      setForm({});
      setPage(1);
    } catch (err: unknown) {
      // Try to parse DRF field errors if available (axios error shape)
      const parseAxiosError = (e: unknown) => {
        const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
        if (!isRecord(e)) return null;
        const resp = e as Record<string, unknown>;
        if (!isRecord(resp.response)) return null;
        const rd = resp.response as Record<string, unknown>;
        if (!isRecord(rd.data)) return null;
        return rd.data;
      };

      const data = parseAxiosError(err);
      if (!data) {
        setError('Error creando atleta');
      } else if (typeof data === 'string') {
        setError(data);
      } else if (typeof data === 'object') {
        const parts: string[] = Object.entries(data).map(([k, v]) => {
          if (Array.isArray(v)) return `${k}: ${v.join(', ')}`;
          return `${k}: ${String(v)}`;
        });
        setError(parts.join(' · '));
      } else {
        setError('Error creando atleta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!showEdit || !form.first_name || !form.last_name || !form.grupo) return;
    setLoading(true);
    try {
      await updateUser(showEdit.id, form);
      setShowEdit(null);
      setForm({});
      // Refetch current page to reflect changes immediately without forcing page reset
      try {
        const res = await listUsers({ page, page_size: PAGE_SIZE });
        setAtletas(res.results);
        setTotal(res.count);
      } catch {
        // fallback: go to first page if refetch fails
        setPage(1);
      }
    } catch {
      setError("Error editando atleta");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setLoading(true);
    try {
      await deleteUser(showDelete.id);
      // After deleting, recalculate total and pages and refresh the list.
      const newTotal = Math.max(0, total - 1);
      const lastPage = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      const newPage = Math.min(page, lastPage);

      setShowDelete(null);
      setTotal(newTotal);

      if (newPage !== page) {
        // Move to a valid page (this will trigger the useEffect fetch)
        setPage(newPage);
      } else {
        // Same page — re-fetch current page to update the list immediately
        try {
          const res = await listUsers({ page: newPage, page_size: PAGE_SIZE });
          setAtletas(res.results);
          setTotal(res.count);
        } catch {
          setError("Error actualizando lista de atletas");
        }
      }
    } catch {
      setError("Error eliminando atleta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
  <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Atletas</h1>
        <Button onClick={() => setShowAdd(true)}>Agregar atleta</Button>
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
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nombre</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Grupo</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Activo</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {atletas.filter(a => a.grupo).length === 0 ? (
                  <TableRow>
                    <TableCell className="px-5 py-4 font-medium text-gray-500 dark:text-gray-400 dark:bg-white/[0.03] bg-white">No hay atletas registrados.</TableCell>
                    <TableCell className="px-5 py-4 dark:bg-white/[0.03] bg-white">""</TableCell>
                    <TableCell className="px-5 py-4 dark:bg-white/[0.03] bg-white">""</TableCell>
                    <TableCell className="px-5 py-4 dark:bg-white/[0.03] bg-white">""</TableCell>
                    <TableCell className="px-5 py-4 dark:bg-white/[0.03] bg-white">""</TableCell>
                  </TableRow>
                ) : (
                  atletas.filter(a => a.grupo).map((a, idx) => (
                    <TableRow key={a.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-800 text-theme-sm dark:text-white/90">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-800 text-theme-sm dark:text-white/90">{a.first_name} {a.last_name}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">{Array.isArray(grupos) ? grupos.find(g => g.id === a.grupo)?.nombre || '-' : '-'}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">{a.rol !== 'inactive' ? 'Sí' : 'No'}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <button
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-200 transition w-full sm:w-auto"
                            onClick={() => { setShowEdit(a); setForm(a); }}
                          >
                            Editar
                          </button>
                          <button
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium sm:ml-2 bg-red-50/80 dark:bg-red-400/10 text-red-600 border border-red-400 hover:bg-red-100 dark:hover:bg-red-400/20 transition w-full sm:w-auto"
                            onClick={() => setShowDelete(a)}
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
      {/* Paginación dinámica con chevrones */}
      <div className="flex justify-center mt-4 gap-1 items-center">
        {(() => {
          const totalPages = Math.ceil(total / PAGE_SIZE);
          if (totalPages <= 1) return null;
          const pages: (number | string)[] = [];
          const add = (n: number | string) => pages.push(n);
          const neighborRange = isMobile ? 2 : 3; // neighbors around current page (mobile:2, desktop:3)
          // Siempre mostrar primera página
          add(1);
          // Si hay salto relevante entre 1 y la primera de la ventana central, mostrar ...
          if (page > 2 + neighborRange) add('...');
          // Mostrar ventana central alrededor de la página actual
          for (let i = Math.max(2, page - neighborRange); i <= Math.min(totalPages - 1, page + neighborRange); i++) {
            add(i);
          }
          // Si hay salto entre la última de la ventana central y la última página, mostrar ...
          if (page < totalPages - (1 + neighborRange)) add('...');
          // Siempre mostrar última página si hay más de una
          if (totalPages > 1) add(totalPages);

          return (
            <>
              {isMobile ? (
                <div className="flex flex-col items-center w-full">
                  {/* Row: numbers (and ellipsis) */}
                  <div className="flex flex-wrap justify-center gap-0.5 items-center w-full mb-2">
                    {pages.map((p, idx) =>
                      typeof p === 'number' ? (
                        <Button
                          key={p}
                          size="sm"
                          variant={page === p ? "primary" : "outline"}
                          className="mx-0.5 px-2 py-0.5 text-sm border-gray-200 shadow-sm"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      ) : (
                        <span key={"ellipsis-" + idx} className="px-2 text-gray-400 select-none">...</span>
                      )
                    )}
                  </div>

                  {/* Row: chevrons below numbers */}
                  <div className="flex justify-center gap-0.5 items-center w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      className="mx-0.5 px-2 py-0.5 border-gray-200 shadow-sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      aria-label="Primera página"
                    >
                      <FiChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mx-0.5 px-2 py-0.5 border-gray-200 shadow-sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      aria-label="Anterior"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mx-0.5 px-2 py-0.5 border-gray-200 shadow-sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      aria-label="Siguiente"
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mx-0.5 px-2 py-0.5 border-gray-200 shadow-sm"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      aria-label="Última página"
                    >
                      <FiChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Doble chevron izquierda (primera) */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mx-1 px-2"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    aria-label="Primera página"
                  >
                    <FiChevronsLeft className="w-5 h-5" />
                  </Button>
                  {/* Anterior */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mx-1 px-2"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Anterior"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </Button>
                  {/* Números y puntos */}
                  {pages.map((p, idx) =>
                    typeof p === 'number' ? (
                      <Button
                        key={p}
                        size="sm"
                        variant={page === p ? "primary" : "outline"}
                        className="mx-1"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ) : (
                      <span key={"ellipsis-" + idx} className="px-2 text-gray-400 select-none">...</span>
                    )
                  )}
                  {/* Chevron derecha (siguiente) */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mx-1 px-2"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    aria-label="Siguiente"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </Button>
                  {/* Última */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mx-1 px-2"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    aria-label="Última página"
                  >
                    <FiChevronsRight className="w-5 h-5" />
                  </Button>
                </>
              )}
            </>
          );
        })()}
      </div>
      {/* Modal agregar */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}>
        <ComponentCard title="Agregar atleta" desc="Rellena los campos para crear un nuevo atleta.">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input
              className="w-full px-4 py-2 mb-3 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500"
              placeholder="Nombre"
              value={form.first_name || ''}
              onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
            />

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
            <input
              className="w-full px-4 py-2 mb-3 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500"
              placeholder="Apellido"
              value={form.last_name || ''}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
            />

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grupo</label>
            <select
              className="w-full px-4 py-2 mb-3 rounded-md border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={form.grupo || ''}
              onChange={e => setForm(f => ({ ...f, grupo: Number(e.target.value) }))}
            >
              <option value="">Seleccionar grupo</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button className="w-full sm:w-auto" onClick={handleAdd}>Crear</Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowAdd(false)}>Cancelar</Button>
            </div>
          </div>
        </ComponentCard>
      </Modal>
      {/* Modal editar */}
      <Modal isOpen={!!showEdit} onClose={() => { setShowEdit(null); setForm({}); }}>
        <ComponentCard title="Editar atleta" desc="Actualiza los campos del atleta seleccionado.">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input
              className="w-full px-4 py-2 mb-3 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500"
              placeholder="Nombre"
              value={form.first_name || ''}
              onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
            />

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
            <input
              className="w-full px-4 py-2 mb-3 rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500"
              placeholder="Apellido"
              value={form.last_name || ''}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
            />

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grupo</label>
            <select
              className="w-full px-4 py-2 mb-3 rounded-md border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={form.grupo || ''}
              onChange={e => setForm(f => ({ ...f, grupo: Number(e.target.value) }))}
            >
              <option value="">Seleccionar grupo</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button className="w-full sm:w-auto" onClick={handleEdit}>Guardar</Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setShowEdit(null); setForm({}); }}>Cancelar</Button>
            </div>
          </div>
        </ComponentCard>
      </Modal>
      {/* Modal eliminar: usar Modal + ComponentCard como en crear/editar */}
      <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)}>
        <ComponentCard title="Eliminar atleta" desc={`¿Eliminar atleta ${showDelete?.first_name || ''} ${showDelete?.last_name || ''}? Esta acción no se puede deshacer.`}>
          <div>
            <p className="text-sm text-red-700 dark:text-red-200">Esta operación eliminará permanentemente al atleta seleccionado.</p>
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

export default AtletasPage;
