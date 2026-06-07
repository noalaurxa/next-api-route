import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [totalAuthors, totalBooks, averagePagesData, genresData] = await Promise.all([
      prisma.author.count(),
      prisma.book.count(),
      prisma.book.aggregate({
        _avg: {
          pages: true,
        },
      }),
      prisma.book.groupBy({
        by: ['genre'],
        where: {
          genre: {
            not: null,
          },
        },
      }),
    ]);

    const averagePages = averagePagesData._avg.pages ? Math.round(averagePagesData._avg.pages) : 0;
    const totalGenres = genresData.filter(g => g.genre).length;

    return NextResponse.json({
      totalAuthors,
      totalBooks,
      totalGenres,
      averagePages,
    });
  } catch (error) {
    console.error('Error in general stats endpoint:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas generales' },
      { status: 500 }
    );
  }
}
