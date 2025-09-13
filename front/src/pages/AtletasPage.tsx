import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import { Modal } from "../components/ui/modal";
import Button from "../components/ui/button/Button";
import { FiChevronsLeft, FiChevronLeft, FiChevronRight, FiChevronsRight } from "react-icons/fi";
import { listUsers, createUser, updateUser, deleteUser } from "../services/user.service";
import { listGrupos } from "../services/grupo.service";
import { Usuario, Grupo, PageResult } from "../types/api";
import LoadingSpinner from "../components/common/LoadingSpinner";

const PAGE_SIZE = 25;

const AtletasPage: React.FC = () => {
  const [atletas, setAtletas] = useState<Usuario[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
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

  // Handlers
  const handleAdd = async () => {
    if (!form.first_name || !form.last_name || !form.grupo) return;
    setLoading(true);
    try {
      await createUser(form);
      setShowAdd(false);
      setForm({});
      setPage(1);
    } catch {
      setError("Error creando atleta");
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
      setPage(1);
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
      setShowDelete(null);
      setPage(1);
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
                        <button
                          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-200 transition"
                          onClick={() => { setShowEdit(a); setForm(a); }}
                        >
                          Editar
                        </button>
                        <button
                          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ml-2 bg-red-50/80 dark:bg-red-400/10 text-red-600 border border-red-400 hover:bg-red-100 dark:hover:bg-red-400/20 transition"
                          onClick={() => setShowDelete(a)}
                        >
                          Eliminar
                        </button>
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
          // Siempre mostrar primera página
          add(1);
          // Si hay salto entre 1 y la actual -2, mostrar ...
          if (page > 4) add('...');
          // Mostrar hasta 2 antes y 2 después de la actual
          for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) {
            add(i);
          }
          // Si hay salto entre la actual +2 y la última, mostrar ...
          if (page < totalPages - 3) add('...');
          // Siempre mostrar última página si hay más de una
          if (totalPages > 1) add(totalPages);

          return (
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
          );
        })()}
      </div>
      {/* Modal agregar */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}>
        <h2 className="text-xl font-bold mb-4">Agregar atleta</h2>
        <div className="mb-2">
          <input className="form-control mb-2" placeholder="Nombre" value={form.first_name || ''} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
          <input className="form-control mb-2" placeholder="Apellido" value={form.last_name || ''} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
          <select className="form-control mb-2" value={form.grupo || ''} onChange={e => setForm(f => ({ ...f, grupo: Number(e.target.value) }))}>
            <option value="">Seleccionar grupo</option>
            {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={handleAdd}>Crear</Button>
          <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
        </div>
      </Modal>
      {/* Modal editar */}
      <Modal isOpen={!!showEdit} onClose={() => { setShowEdit(null); setForm({}); }}>
        <h2 className="text-xl font-bold mb-4">Editar atleta</h2>
        <div className="mb-2">
          <input className="form-control mb-2" placeholder="Nombre" value={form.first_name || ''} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
          <input className="form-control mb-2" placeholder="Apellido" value={form.last_name || ''} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
          <select className="form-control mb-2" value={form.grupo || ''} onChange={e => setForm(f => ({ ...f, grupo: Number(e.target.value) }))}>
            <option value="">Seleccionar grupo</option>
            {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={handleEdit}>Guardar</Button>
          <Button variant="outline" onClick={() => { setShowEdit(null); setForm({}); }}>Cancelar</Button>
        </div>
      </Modal>
      {/* Modal eliminar */}
      <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)}>
        <h2 className="text-xl font-bold mb-4">Eliminar atleta</h2>
        <p>¿Eliminar atleta <strong>{showDelete?.first_name} {showDelete?.last_name}</strong>? Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" className="text-red-600 border-red-400 hover:bg-red-50" onClick={handleDelete}>Confirmar</Button>
          <Button variant="outline" onClick={() => setShowDelete(null)}>Cancelar</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AtletasPage;
