"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Author {
  id: string;
  name: string;
  email: string;
  bio?: string;
  nationality?: string;
  birthYear?: number;
  _count?: { books: number };
}

interface GeneralStats {
  totalAuthors: number;
  totalBooks: number;
  totalGenres: number;
  averagePages: number;
}

const emptyForm = {
  name: "",
  email: "",
  bio: "",
  nationality: "",
  birthYear: "",
};

export default function Dashboard() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ar, sr] = await Promise.all([
        fetch("/api/authors"),
        fetch("/api/stats"),
      ]);
      if (!ar.ok || !sr.ok) throw new Error("Error al cargar los datos.");
      setAuthors(await ar.json());
      setStats(await sr.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setFormData(emptyForm);
    setFormError(null);
    setModalType("create");
    setModalOpen(true);
  };

  const openEdit = (a: Author) => {
    setSelectedAuthor(a);
    setFormData({
      name: a.name, email: a.email,
      bio: a.bio || "", nationality: a.nationality || "",
      birthYear: a.birthYear?.toString() || "",
    });
    setFormError(null);
    setModalType("edit");
    setModalOpen(true);
  };

  const openDelete = (a: Author) => {
    setSelectedAuthor(a);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    if (!formData.name || !formData.email) {
      setFormError("El nombre y el correo son obligatorios.");
      setSubmitting(false);
      return;
    }
    try {
      const url = modalType === "create" ? "/api/authors" : `/api/authors/${selectedAuthor?.id}`;
      const res = await fetch(url, {
        method: modalType === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar.");
      setModalOpen(false);
      fetchData();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAuthor) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/authors/${selectedAuthor.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "No se pudo eliminar.");
      }
      setDeleteConfirmOpen(false);
      setSelectedAuthor(null);
      fetchData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = authors.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.nationality || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ─── Header ─────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 20, fontStyle: "italic", color: "var(--text)", letterSpacing: "-0.01em" }}>
            Biblioteca
          </span>
          <nav style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.01em" }}>Autores</span>
            <Link href="/books" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", textDecoration: "none", letterSpacing: "0.01em" }}
              onMouseOver={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseOut={e => (e.currentTarget.style.color = "var(--text-2)")}>
              Libros
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 32px" }}>

        {/* ─── Page title ─────────────────────────────────────── */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 34, fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>
            Panel de Control
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-2)" }}>
            Gestiona los autores y el acervo de tu biblioteca.
          </p>
        </div>

        {/* ─── Stats strip ────────────────────────────────────── */}
        {stats && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
            marginBottom: 48,
          }}>
            {[
              { value: stats.totalAuthors, label: "Autores" },
              { value: stats.totalBooks, label: "Libros registrados" },
              { value: stats.totalGenres, label: "Géneros únicos" },
              { value: stats.averagePages > 0 ? `${stats.averagePages} pág.` : "—", label: "Páginas promedio" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "24px 28px",
                borderRight: i < 3 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 36, fontWeight: 700, color: "var(--text)", lineHeight: 1, marginBottom: 6 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Section header ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 22, fontWeight: 500, color: "var(--text)", margin: 0, fontStyle: "italic" }}>
            Directorio de Autores
          </h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-base"
              style={{ width: 220 }}
            />
            <button className="btn-primary" onClick={openCreate}>
              Nuevo autor
            </button>
          </div>
        </div>

        {/* ─── Author list ─────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className="alert-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "64px 0", textAlign: "center", color: "var(--text-3)", fontSize: 14, borderTop: "1px solid var(--border)" }}>
            {searchQuery ? "Sin resultados para esa búsqueda." : "No hay autores registrados. Crea el primero."}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {filtered.map((author) => (
              <div key={author.id} className="card" style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 0 }}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                  <Link href={`/authors/${author.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 17, fontWeight: 500, color: "var(--text)", lineHeight: 1.3 }}
                      onMouseOver={e => (e.currentTarget.style.color = "var(--accent-2)")}
                      onMouseOut={e => (e.currentTarget.style.color = "var(--text)")}>
                      {author.name}
                    </div>
                  </Link>
                  {author.nationality && (
                    <span className="tag" style={{ flexShrink: 0 }}>{author.nationality}</span>
                  )}
                </div>

                {/* Email */}
                <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 12 }}>{author.email}</div>

                {/* Bio */}
                <p style={{
                  fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6,
                  display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                  overflow: "hidden", margin: "0 0 20px",
                }}>
                  {author.bio || "Sin biografía."}
                </p>

                {/* Footer */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                    <strong style={{ color: "var(--text-2)", fontWeight: 600 }}>{author._count?.books ?? 0}</strong> {author._count?.books === 1 ? "libro" : "libros"}
                  </span>
                  <div style={{ display: "flex", gap: 2 }}>
                    <Link href={`/authors/${author.id}`}>
                      <button className="btn-ghost">Ver perfil</button>
                    </Link>
                    <button className="btn-ghost" onClick={() => openEdit(author)}>Editar</button>
                    <button className="btn-danger-ghost" onClick={() => openDelete(author)}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─── CREATE / EDIT MODAL ────────────────────────────── */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
                {modalType === "create" ? "Nuevo autor" : "Editar autor"}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
              {formError && <div className="alert-error">{formError}</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Nombre *</label>
                <input className="input-base" type="text" required placeholder="Nombre completo" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Correo electrónico *</label>
                <input className="input-base" type="email" required placeholder="correo@ejemplo.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Nacionalidad</label>
                  <input className="input-base" type="text" placeholder="Ej. Colombiana" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Año de nacimiento</label>
                  <input className="input-base" type="number" placeholder="Ej. 1927" value={formData.birthYear} onChange={e => setFormData({ ...formData, birthYear: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Biografía</label>
                <textarea className="textarea-base" rows={3} placeholder="Breve descripción del autor..." value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 6, borderTop: "1px solid var(--border)", marginTop: 4 }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ───────────────────────────── */}
      {deleteConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "28px 28px 24px" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Eliminar autor</h3>
              <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>
                Esto eliminará permanentemente a <strong style={{ color: "var(--text)" }}>{selectedAuthor?.name}</strong> junto con todos sus libros. Esta acción no se puede deshacer.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button className="btn-secondary" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</button>
                <button onClick={handleDelete} disabled={submitting}
                  style={{ height: 38, padding: "0 18px", background: "var(--danger)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: submitting ? 0.5 : 1, fontFamily: "inherit" }}>
                  {submitting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
