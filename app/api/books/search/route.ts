import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const genre = searchParams.get('genre');
    const authorName = searchParams.get('authorName');
    
    // Pagination parameters
    const pageVal = searchParams.get('page');
    const limitVal = searchParams.get('limit');
    const page = pageVal ? Math.max(1, parseInt(pageVal)) : 1;
    const limit = limitVal ? Math.min(50, Math.max(1, parseInt(limitVal))) : 10;
    
    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    
    // Build query conditions
    const where: Prisma.BookWhereInput = {};
    
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }
    
    if (genre && genre.trim() !== '') {
      where.genre = {
        equals: genre,
      };
    }
    
    if (authorName) {
      where.author = {
        name: {
          contains: authorName,
          mode: 'insensitive',
        },
      };
    }
    
    // Validate sortBy field
    const allowedSortFields = ['title', 'publishedYear', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';
    
    const skip = (page - 1) * limit;
    const take = limit;
    
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortField]: sortOrder,
        },
        skip,
        take,
      }),
      prisma.book.count({ where }),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return NextResponse.json({
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    console.error('Error in search endpoint:', error);
    return NextResponse.json(
      { error: 'Error al buscar libros' },
      { status: 500 }
    );
  }
}
