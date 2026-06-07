"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Book {
  id: string;
  title: string;
  description?: string;
  isbn?: string;
  publishedYear?: number;
  genre?: string;
  pages?: number;
  authorId: string;
}

interface Author {
  id: string;
  name: string;
  email: string;
  bio?: string;
  nationality?: string;
  birthYear?: number;
  books: Book[];
  _count?: { books: number };
}

interface AuthorStats {
  authorId: string;
  authorName: string;
  totalBooks: number;
  firstBook: { title: string; year: number } | null;
  latestBook: { title: string; year: number } | null;
  averagePages: number;
  genres: string[];
  longestBook: { title: string; pages: number } | null;
  shortestBook: { title: string; pages: number } | null;
}

const emptyBookForm = { title: "", description: "", isbn: "", publishedYear: "", genre: "", pages: "" };

export default function AuthorDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [author, setAuthor] = useState<Author | null>(null);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Author
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", bio: "", nationality: "", birthYear: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Book modal (add or edit)
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookModalType, setBookModalType] = useState<"add" | "edit">("add");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState(emptyBookForm);
  const [bookError, setBookError] = useState<string | null>(null);
  const [bookSubmitting, setBookSubmitting] = useState(false);

  // Delete book
  const [deleteBookOpen, setDeleteBookOpen] = useState(false);
  const [deleteBookSubmitting, setDeleteBookSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ar, sr] = await Promise.all([
        fetch(`/api/authors/${id}`),
        fetch(`/api/authors/${id}/stats`),
      ]);
      if (ar.status === 404) { setError("Autor no encontrado."); return; }
      if (!ar.ok || !sr.ok) throw new Error("Error al obtener los datos.");
      setAuthor(await ar.json());
      setStats(await sr.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchData(); }, [id]);

  const openEditAuthor = () => {
    if (!author) return;
    setEditForm({
      name: author.name, email: author.email,
      bio: author.bio || "", nationality: author.nationality || "",
      birthYear: author.birthYear?.toString() || "",
    });
    setEditError(null);
    setEditOpen(true);
  };

  const submitEditAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSubmitting(true);
    if (!editForm.name || !editForm.email) { setEditError("Nombre y correo son obligatorios."); setEditSubmitting(false); return; }
    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar.");
      setEditOpen(false);
      fetchData();
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const openAddBook = () => {
    setBookForm(emptyBookForm);
    setBookError(null);
    setBookModalType("add");
    setBookModalOpen(true);
  };

  const openEditBook = (b: Book) => {
    setSelectedBook(b);
    setBookForm({
      title: b.title, description: b.description || "", isbn: b.isbn || "",
      publishedYear: b.publishedYear?.toString() || "",
      genre: b.genre || "", pages: b.pages?.toString() || "",
    });
    setBookError(null);
    setBookModalType("edit");
    setBookModalOpen(true);
  };

  const submitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookError(null);
    setBookSubmitting(true);
    if (!bookForm.title) { setBookError("El título es obligatorio."); setBookSubmitting(false); return; }
    try {
      const url = bookModalType === "add" ? "/api/books" : `/api/books/${selectedBook?.id}`;
      const res = await fetch(url, {
        method: bookModalType === "add" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookForm, authorId: id,
          publishedYear: bookForm.publishedYear ? parseInt(bookForm.publishedYear) : null,
          pages: bookForm.pages ? parseInt(bookForm.pages) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar.");
      setBookModalOpen(false);
      fetchData();
    } catch (e: any) {
      setBookError(e.message);
    } finally {
      setBookSubmitting(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    setDeleteBookSubmitting(true);
    try {
      const res = await fetch(`/api/books/${selectedBook.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setDeleteBookOpen(false);
      setSelectedBook(null);
      fetchData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleteBookSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="spinner" />
    </div>
  );

  if (error || !author) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", gap: 16 }}>
      <p style={{ color: "var(--danger)", fontSize: 15 }}>{error || "Autor no encontrado."}</p>
      <Link href="/" style={{ fontSize: 13, color: "var(--accent-2)", textDecoration: "underline" }}>Volver al dashboard</Link>
    </div>
  );

  // Label style shorthand
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" };
  const inputStyle = "input-base";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ─── Header ─────────────────────────────────────────── */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 20, fontStyle: "italic", color: "var(--text)" }}>Biblioteca</span>
          <nav style={{ display: "flex", gap: 28 }}>
            {[{ href: "/", label: "Autores" }, { href: "/books", label: "Libros" }].map(n => (
              <Link key={n.href} href={n.href} style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", textDecoration: "none" }}
                onMouseOver={e => (e.currentTarget.style.color = "var(--text)")}
                onMouseOut={e => (e.currentTarget.style.color = "var(--text-2)")}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 32px" }}>

        {/* ─── Breadcrumb ─────────────────────────────────────── */}
        <nav style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 36, fontSize: 12.5, color: "var(--text-3)" }}>
          <Link href="/" style={{ color: "var(--text-3)", textDecoration: "none" }}
            onMouseOver={e => (e.currentTarget.style.color = "var(--accent-2)")}
            onMouseOut={e => (e.currentTarget.style.color = "var(--text-3)")}>
            Dashboard
          </Link>
          <span>›</span>
          <span style={{ color: "var(--text-2)" }}>{author.name}</span>
        </nav>

        {/* ─── Author profile ──────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Top accent line */}
          <div style={{ height: 3, background: "var(--accent-2)", borderRadius: "2px 2px 0 0", width: 48 }} />

          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0 12px 12px 12px",
            padding: "32px 36px", marginBottom: 40,
            display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 style={{ margin: "0 0 6px", fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 32, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>
                {author.name}
              </h1>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-3)" }}>{author.email}</p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                {author.nationality && <span className="tag">{author.nationality}</span>}
                {author.birthYear && <span className="tag">n. {author.birthYear}</span>}
              </div>

              {author.bio && (
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, maxWidth: 600 }}>
                  {author.bio}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button className="btn-secondary" onClick={openEditAuthor}>Editar perfil</button>
              <button className="btn-primary" onClick={openAddBook}>Añadir libro</button>
            </div>
          </div>
        </div>

        {/* ─── Stats ──────────────────────────────────────────── */}
        {stats && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 20, fontWeight: 500, fontStyle: "italic", color: "var(--text)", margin: "0 0 20px" }}>
              Estadísticas
            </h2>

            {/* Numbers row */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
              marginBottom: 24,
            }}>
              {[
                { value: stats.totalBooks, label: "Libros publicados" },
                { value: stats.averagePages || "—", label: "Páginas promedio" },
                { value: stats.genres.length || "—", label: "Géneros escritos" },
                {
                  value: (stats.firstBook?.year && stats.latestBook?.year)
                    ? `${stats.firstBook.year}–${stats.latestBook.year}` : "—",
                  label: "Rango de años"
                },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: "20px 24px",
                  borderRight: i < 3 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 30, fontWeight: 700, color: "var(--text)", lineHeight: 1, marginBottom: 5 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Detail cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Publication timeline */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px 24px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Cronología
                </h3>
                {stats.firstBook ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 3 }}>Primer libro</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{stats.firstBook.title}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>{stats.firstBook.year}</span>
                    </div>
                    {stats.latestBook && stats.latestBook.title !== stats.firstBook.title && (
                      <>
                        <div className="divider" />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 3 }}>Libro más reciente</div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{stats.latestBook.title}</div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{stats.latestBook.year}</span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>Sin datos de publicación.</p>
                )}
              </div>

              {/* Pages */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px 24px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Extensión de obras
                </h3>
                {stats.longestBook ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 3 }}>Más extenso</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{stats.longestBook.title}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{stats.longestBook.pages} pág.</span>
                    </div>
                    {stats.shortestBook && stats.shortestBook.title !== stats.longestBook.title && (
                      <>
                        <div className="divider" />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 3 }}>Más breve</div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{stats.shortestBook.title}</div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{stats.shortestBook.pages} pág.</span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>Sin datos de páginas.</p>
                )}
              </div>

              {/* Genres */}
              {stats.genres.length > 0 && (
                <div style={{ gridColumn: "1 / -1", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px 24px" }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Géneros
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {stats.genres.map(g => (
                      <span key={g} className="tag" style={{ borderColor: "var(--accent-2)", color: "var(--accent-2)" }}>{g}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Books list ──────────────────────────────────────── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 20, fontWeight: 500, fontStyle: "italic", color: "var(--text)", margin: 0 }}>
              Libros publicados
              <span style={{ fontFamily: "var(--font-inter, system-ui)", fontStyle: "normal", fontSize: 13, color: "var(--text-3)", marginLeft: 10, fontWeight: 400 }}>
                {author.books.length} {author.books.length === 1 ? "título" : "títulos"}
              </span>
            </h2>
            <button className="btn-secondary" onClick={openAddBook} style={{ fontSize: 12.5 }}>+ Añadir</button>
          </div>

          {author.books.length === 0 ? (
            <div style={{
              padding: "48px 0", textAlign: "center", color: "var(--text-3)", fontSize: 14,
              border: "1px dashed var(--border)", borderRadius: 12,
            }}>
              Este autor no tiene libros registrados.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {author.books.map(book => (
                <div key={book.id} className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 15, fontWeight: 500, color: "var(--text)", lineHeight: 1.35 }}>
                        {book.title}
                      </h3>
                      {book.genre && <span className="tag" style={{ flexShrink: 0 }}>{book.genre}</span>}
                    </div>

                    <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {book.description || "Sin descripción."}
                    </p>

                    <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-3)" }}>
                      {book.publishedYear && <span><strong style={{ color: "var(--text-2)" }}>{book.publishedYear}</strong></span>}
                      {book.pages && <span><strong style={{ color: "var(--text-2)" }}>{book.pages}</strong> págs.</span>}
                      {book.isbn && <span style={{ fontVariantNumeric: "tabular-nums", fontFamily: "monospace", fontSize: 11 }}>{book.isbn}</span>}
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 4 }}>
                    <button className="btn-ghost" onClick={() => openEditBook(book)}>Editar</button>
                    <button className="btn-danger-ghost" onClick={() => { setSelectedBook(book); setDeleteBookOpen(true); }}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ─── EDIT AUTHOR MODAL ──────────────────────────────── */}
      {editOpen && (
        <div className="modal-backdrop" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Editar perfil</h3>
              <button onClick={() => setEditOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 18 }}>×</button>
            </div>
            <form onSubmit={submitEditAuthor} style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
              {editError && <div className="alert-error">{editError}</div>}

              {[
                { lbl: "Nombre *", key: "name", type: "text", ph: "Nombre completo" },
                { lbl: "Correo electrónico *", key: "email", type: "email", ph: "correo@ejemplo.com" },
              ].map(f => (
                <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>{f.lbl}</label>
                  <input className={inputStyle} type={f.type} required={f.lbl.includes("*")} placeholder={f.ph}
                    value={(editForm as any)[f.key]}
                    onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })} />
                </div>
              ))}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>Nacionalidad</label>
                  <input className={inputStyle} type="text" placeholder="Ej. Colombiana" value={editForm.nationality} onChange={e => setEditForm({ ...editForm, nationality: e.target.value })} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>Año de nacimiento</label>
                  <input className={inputStyle} type="number" placeholder="Ej. 1927" value={editForm.birthYear} onChange={e => setEditForm({ ...editForm, birthYear: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={lbl}>Biografía</label>
                <textarea className="textarea-base" rows={3} placeholder="Breve descripción..." value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 6, borderTop: "1px solid var(--border)", marginTop: 4 }}>
                <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={editSubmitting}>{editSubmitting ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── BOOK MODAL (ADD / EDIT) ────────────────────────── */}
      {bookModalOpen && (
        <div className="modal-backdrop" onClick={() => setBookModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
                {bookModalType === "add" ? `Añadir libro` : "Editar libro"}
              </h3>
              <button onClick={() => setBookModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 18 }}>×</button>
            </div>
            <form onSubmit={submitBook} style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
              {bookError && <div className="alert-error">{bookError}</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={lbl}>Título *</label>
                <input className={inputStyle} required placeholder="Título del libro" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>Género</label>
                  <input className={inputStyle} placeholder="Ej. Novela" value={bookForm.genre} onChange={e => setBookForm({ ...bookForm, genre: e.target.value })} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>ISBN</label>
                  <input className={inputStyle} placeholder="978-..." value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>Año de publicación</label>
                  <input className={inputStyle} type="number" placeholder="Ej. 1967" value={bookForm.publishedYear} onChange={e => setBookForm({ ...bookForm, publishedYear: e.target.value })} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>Páginas</label>
                  <input className={inputStyle} type="number" placeholder="Ej. 417" value={bookForm.pages} onChange={e => setBookForm({ ...bookForm, pages: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={lbl}>Descripción</label>
                <textarea className="textarea-base" rows={3} placeholder="Sinopsis..." value={bookForm.description} onChange={e => setBookForm({ ...bookForm, description: e.target.value })} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 6, borderTop: "1px solid var(--border)", marginTop: 4 }}>
                <button type="button" className="btn-secondary" onClick={() => setBookModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={bookSubmitting}>{bookSubmitting ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE BOOK CONFIRM ────────────────────────────── */}
      {deleteBookOpen && selectedBook && (
        <div className="modal-backdrop" onClick={() => setDeleteBookOpen(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "28px 28px 24px" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Eliminar libro</h3>
              <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>
                Esto eliminará permanentemente <strong style={{ color: "var(--text)" }}>{selectedBook.title}</strong>. Esta acción no se puede deshacer.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button className="btn-secondary" onClick={() => setDeleteBookOpen(false)}>Cancelar</button>
                <button onClick={handleDeleteBook} disabled={deleteBookSubmitting}
                  style={{ height: 38, padding: "0 18px", background: "var(--danger)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: deleteBookSubmitting ? 0.5 : 1, fontFamily: "inherit" }}>
                  {deleteBookSubmitting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
