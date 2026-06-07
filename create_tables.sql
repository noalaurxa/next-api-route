-- Crear tabla Author
CREATE TABLE IF NOT EXISTS "Author" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name"        TEXT NOT NULL,
  "email"       TEXT NOT NULL,
  "bio"         TEXT,
  "nationality" TEXT,
  "birthYear"   INTEGER,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Author_email_key" ON "Author"("email");

-- Crear tabla Book
CREATE TABLE IF NOT EXISTS "Book" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid(),
  "title"         TEXT NOT NULL,
  "description"   TEXT,
  "isbn"          TEXT,
  "publishedYear" INTEGER,
  "genre"         TEXT,
  "pages"         INTEGER,
  "authorId"      TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Book_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Book_authorId_fkey" FOREIGN KEY ("authorId")
    REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Book_isbn_key"      ON "Book"("isbn");
CREATE INDEX        IF NOT EXISTS "Book_authorId_idx"  ON "Book"("authorId");
CREATE INDEX        IF NOT EXISTS "Book_genre_idx"     ON "Book"("genre");
CREATE INDEX        IF NOT EXISTS "Book_title_idx"     ON "Book"("title");

-- Función para auto-actualizar updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updatedAt
DROP TRIGGER IF EXISTS update_author_updated_at ON "Author";
CREATE TRIGGER update_author_updated_at
  BEFORE UPDATE ON "Author"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_book_updated_at ON "Book";
CREATE TRIGGER update_book_updated_at
  BEFORE UPDATE ON "Book"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
