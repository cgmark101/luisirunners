import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import { Modal } from "../components/ui/modal";
import Button from "../components/ui/button/Button";
import { listUsers, createUser, updateUser, deleteUser } from "../services/user.service";
import { listGrupos } from "../services/grupo.service";
import { Usuario, Grupo, PageResult } from "../types/api";
import LoadingSpinner from "../components/common/LoadingSpinner";

const PAGE_SIZE = 10;

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
    listGrupos().then(setGrupos);
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
        <h1 className="text-2xl font-bold">Atletas</h1>
        <Button onClick={() => setShowAdd(true)}>Agregar atleta</Button>
      </div>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>#</TableCell>
              <TableCell isHeader>Nombre</TableCell>
              <TableCell isHeader>Grupo</TableCell>
              <TableCell isHeader>Activo</TableCell>
              <TableCell isHeader>Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {atletas.length === 0 ? (
              <TableRow>
                <TableCell>No hay atletas registrados.</TableCell>
                <TableCell>""</TableCell>
                <TableCell>""</TableCell>
                <TableCell>""</TableCell>
                <TableCell>""</TableCell>
              </TableRow>
            ) : (
              atletas.map((a, idx) => (
                <TableRow key={a.id}>
                  <TableCell>{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                  <TableCell>{a.first_name} {a.last_name}</TableCell>
                  <TableCell>{grupos.find(g => g.id === a.grupo)?.nombre || '-'}</TableCell>
                  <TableCell>{a.rol !== 'inactive' ? 'Sí' : 'No'}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => { setShowEdit(a); setForm(a); }}>Editar</Button>
                    <Button size="sm" variant="outline" className="ml-2 text-red-600 border-red-400 hover:bg-red-50" onClick={() => setShowDelete(a)}>Eliminar</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
      {/* Paginación */}
      <div className="flex justify-center mt-4">
        {Array.from({ length: Math.ceil(total / PAGE_SIZE) }, (_, i) => (
          <Button
            key={i}
            size="sm"
            variant={page === i + 1 ? "primary" : "outline"}
            className="mx-1"
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
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
