import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Collection } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/collections?project_id=xxx - Get all collections for a project
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('project_id');

  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  try {
    // Get collections with image counts
    const { data: collections, error } = await supabase
      .from('collections')
      .select(`
        *,
        images (count)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to include imageCount
    const formattedCollections: Collection[] = (collections || []).map((col: any) => ({
      id: col.id,
      project_id: col.project_id,
      name: col.name,
      room_type: col.room_type,
      created_at: col.created_at,
      updated_at: col.updated_at,
      imageCount: col.images?.[0]?.count || 0,
      metadata: col.metadata,
    }));

    return NextResponse.json({ collections: formattedCollections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// POST /api/collections - Create a new collection
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { project_id, name, room_type } = body;

    if (!project_id || !name) {
      return NextResponse.json(
        { error: 'project_id and name are required' },
        { status: 400 }
      );
    }

    const collectionId = `collection-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const { data, error } = await supabase
      .from('collections')
      .insert([
        {
          id: collectionId,
          project_id,
          name,
          room_type: room_type || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Collection created: ${collectionId} - ${name}`);

    return NextResponse.json({ collection: data });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create collection' },
      { status: 500 }
    );
  }
}
