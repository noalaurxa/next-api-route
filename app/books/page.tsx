"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Author { id: string; name: string; }

interface Book {
  id: string;
  title: string;
  description?: string;
  isbn?: string;
  publishedYear?: number;
  genre?: string;
  pages?: number;
  authorId: string;
  createdAt: string;
  author: { id: string; name: string; email: string };
}

interface PaginationMeta {
  page: number; limit: number; total: number;
  totalPages: number; hasNext: boolean; hasPrev: boolean;
}

const emptyBookForm = {
  title: "", description: "", isbn: "",
  publishedYear: "", genre: "", pages: "", authorId: "",
};

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1, limit: 9, total: 0, totalPages: 1, hasNext: false, hasPrev: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const LIMIT = 9;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [formData, setFormData] = useState(emptyBookForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [debouncedSearch, genreFilter, authorFilter, sortBy, order]);

  const fetchMeta = async () => {
    try {
      const [ar, br] = await Promise.all([fetch("/api/authors"), fetch("/api/books")]);
      if (ar.ok) {
        const ad = await ar.json();
        setAuthors(ad);
      }
      if (br.ok) {
        const bd = await br.json();
        const unique: string[] = Array.from(new Set(bd.map((b: any) => b.genre).filter(Boolean)));
        setGenres(unique.sort());
      }
    } catch {}
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const q = new URLSearchParams({
        search: debouncedSearch, genre: genreFilter,
        authorName: authorFilter, sortBy, order,
        page: page.toString(), limit: LIMIT.toString(),
      });
      const res = await fetch(`/api/books/search?${q}`);
      if (!res.ok) throw new Error("Error al buscar libros.");
      const result = await res.json();
      setBooks(result.data);
      setPagination(result.pagination);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchBooks(); }, [debouncedSearch, genreFilter, authorFilter, sortBy, order, page]);

  const openCreate = () => {
    setFormData({ ...emptyBookForm, authorId: authors[0]?.id || "" });
    setFormError(null);
    setModalType("create");
    setModalOpen(true);
  };

  const openEdit = (b: Book) => {
    setSelectedBook(b);
    setFormData({
      title: b.title, description: b.description || "",
      isbn: b.isbn || "", publishedYear: b.publishedYear?.toString() || "",
      genre: b.genre || "", pages: b.pages?.toString() || "", authorId: b.authorId,
    });
    setFormError(null);
    setModalType("edit");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    if (!formData.title || !formData.authorId) {
      setFormError("El título y el autor son obligatorios.");
      setSubmitting(false);
      return;
    }
    try {
      const url = modalType === "create" ? "/api/books" : `/api/books/${selectedBook?.id}`;
      const res = await fetch(url, {
        method: modalType === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : null,
          pages: formData.pages ? parseInt(formData.pages) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar.");
      setModalOpen(false);
      fetchBooks();
      fetchMeta();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBook) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/books/${selectedBook.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setDeleteConfirmOpen(false);
      setSelectedBook(null);
      fetchBooks();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ─── Header ─────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 20, fontStyle: "italic", color: "var(--text)" }}>
            Biblioteca
          </span>
          <nav style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <Link href="/" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", textDecoration: "none" }}
              onMouseOver={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseOut={e => (e.currentTarget.style.color = "var(--text-2)")}>
              Autores
            </Link>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>Libros</span>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 32px" }}>

        {/* ─── Page title ─────────────────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 34, fontWeight: 700, color: "var(--text)", margin: 0 }}>
            Catálogo de Libros
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-2)" }}>
            Busca, filtra y gestiona el inventario de libros de tu biblioteca.
          </p>
        </div>

        {/* ─── Filter bar ─────────────────────────────────────── */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "20px 24px", marginBottom: 28,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Buscar por título</label>
              <input className="input-base" type="text" placeholder="Escribe para buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Género</label>
              <select className="select-base" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}>
                <option value="">Todos los géneros</option>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Autor</label>
              <select className="select-base" value={authorFilter} onChange={e => setAuthorFilter(e.target.value)}>
                <option value="">Todos los autores</option>
                {authors.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Ordenar por</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select className="select-base" style={{ flex: 1 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="createdAt">Fecha de registro</option>
                  <option value="title">Título</option>
                  <option value="publishedYear">Año de publicación</option>
                </select>
                <button
                  onClick={() => setOrder(o => o === "asc" ? "desc" : "asc")}
                  title={order === "asc" ? "Ascendente" : "Descendente"}
                  style={{
                    width: 40, height: 40, flexShrink: 0,
                    border: "1px solid var(--border)", borderRadius: 8,
                    background: "var(--surface)", cursor: "pointer",
                    color: "var(--text-2)", fontSize: 13,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "inherit",
                  }}>
                  {order === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>
              {loading ? "Buscando..." : (
                <>{pagination.total > 0 ? <><strong style={{ color: "var(--text-2)" }}>{pagination.total}</strong> resultado{pagination.total !== 1 ? "s" : ""}</> : "Sin resultados"}</>
              )}
            </span>
            <button className="btn-primary" onClick={openCreate} disabled={authors.length === 0}>
              Añadir libro
            </button>
          </div>
        </div>

        {/* ─── Book grid ──────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className="alert-error">{error}</div>
        ) : books.length === 0 ? (
          <div style={{ padding: "64px 0", textAlign: "center", color: "var(--text-3)", fontSize: 14, borderTop: "1px solid var(--border)" }}>
            No hay libros que coincidan con los filtros seleccionados.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {books.map(book => (
              <div key={book.id} className="card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 16, fontWeight: 500, color: "var(--text)", lineHeight: 1.35 }}>
                      {book.title}
                    </h3>
                    {book.genre && <span className="tag" style={{ flexShrink: 0 }}>{book.genre}</span>}
                  </div>

                  <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 12 }}>
                    <Link href={`/authors/${book.author.id}`} style={{ color: "var(--accent-2)", textDecoration: "none", fontWeight: 500 }}
                      onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}>
                      {book.author.name}
                    </Link>
                  </div>

                  <p style={{
                    margin: "0 0 16px", fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6,
                    display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {book.description || "Sin descripción."}
                  </p>

                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-3)", marginBottom: 0 }}>
                    {book.publishedYear && <span>Publicado en <strong style={{ color: "var(--text-2)" }}>{book.publishedYear}</strong></span>}
                    {book.pages && <span><strong style={{ color: "var(--text-2)" }}>{book.pages}</strong> páginas</span>}
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 4 }}>
                  <button className="btn-ghost" onClick={() => openEdit(book)}>Editar</button>
                  <button className="btn-danger-ghost" onClick={() => { setSelectedBook(book); setDeleteConfirmOpen(true); }}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Pagination ─────────────────────────────────────── */}
        {!loading && pagination.totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 40, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
            <button className="btn-secondary" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}>
              Anterior
            </button>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>
              Página <strong>{pagination.page}</strong> de <strong>{pagination.totalPages}</strong>
            </span>
            <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}>
              Siguiente
            </button>
          </div>
        )}
      </main>

      {/* ─── BOOK MODAL ─────────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
                {modalType === "create" ? "Añadir libro" : "Editar libro"}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 18 }}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
              {formError && <div className="alert-error">{formError}</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Título *</label>
                <input className="input-base" required placeholder="Título del libro" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Autor *</label>
                <select className="select-base" required value={formData.authorId} onChange={e => setFormData({ ...formData, authorId: e.target.value })}>
                  {authors.length === 0 ? <option value="">Sin autores registrados</option> : authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Género</label>
                  <input className="input-base" placeholder="Ej. Novela" value={formData.genre} onChange={e => setFormData({ ...formData, genre: e.target.value })} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>ISBN</label>
                  <input className="input-base" placeholder="ISBN" value={formData.isbn} onChange={e => setFormData({ ...formData, isbn: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Año de publicación</label>
                  <input className="input-base" type="number" placeholder="Ej. 1967" value={formData.publishedYear} onChange={e => setFormData({ ...formData, publishedYear: e.target.value })} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Páginas</label>
                  <input className="input-base" type="number" placeholder="Ej. 417" value={formData.pages} onChange={e => setFormData({ ...formData, pages: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Descripción</label>
                <textarea className="textarea-base" rows={3} placeholder="Sinopsis del libro..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 6, borderTop: "1px solid var(--border)", marginTop: 4 }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting || authors.length === 0}>
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM ─────────────────────────────────── */}
      {deleteConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "28px 28px 24px" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Eliminar libro</h3>
              <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>
                Esto eliminará permanentemente <strong style={{ color: "var(--text)" }}>{selectedBook?.title}</strong>. Esta acción no se puede deshacer.
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
