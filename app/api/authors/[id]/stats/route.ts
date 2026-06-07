import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        books: true,
      },
    });
    
    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      );
    }
    
    const books = author.books;
    const totalBooks = books.length;
    
    // Filter books for year statistics
    const booksWithYear = books.filter(b => b.publishedYear !== null && b.publishedYear !== undefined);
    const firstBook = booksWithYear.length > 0
      ? booksWithYear.reduce((min, b) => b.publishedYear! < min.publishedYear! ? b : min, booksWithYear[0])
      : null;
    const latestBook = booksWithYear.length > 0
      ? booksWithYear.reduce((max, b) => b.publishedYear! > max.publishedYear! ? b : max, booksWithYear[0])
      : null;
      
    // Filter books for page statistics
    const booksWithPages = books.filter(b => b.pages !== null && b.pages !== undefined);
    const averagePages = booksWithPages.length > 0
      ? Math.round(booksWithPages.reduce((sum, b) => sum + b.pages!, 0) / booksWithPages.length)
      : 0;
      
    const longestBook = booksWithPages.length > 0
      ? booksWithPages.reduce((max, b) => b.pages! > max.pages! ? b : max, booksWithPages[0])
      : null;
      
    const shortestBook = booksWithPages.length > 0
      ? booksWithPages.reduce((min, b) => b.pages! < min.pages! ? b : min, booksWithPages[0])
      : null;
      
    const genres = Array.from(new Set(books.map(b => b.genre).filter(Boolean)));
    
    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks,
      firstBook: firstBook ? { title: firstBook.title, year: firstBook.publishedYear } : null,
      latestBook: latestBook ? { title: latestBook.title, year: latestBook.publishedYear } : null,
      averagePages,
      genres,
      longestBook: longestBook ? { title: longestBook.title, pages: longestBook.pages } : null,
      shortestBook: shortestBook ? { title: shortestBook.title, pages: shortestBook.pages } : null,
    });
  } catch (error) {
    console.error('Error in author stats endpoint:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del autor' },
      { status: 500 }
    );
  }
}
