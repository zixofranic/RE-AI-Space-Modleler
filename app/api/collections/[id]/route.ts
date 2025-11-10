import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/collections/[id] - Get a specific collection with its images
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;

  try {
    // Get collection details
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();

    if (collectionError) throw collectionError;
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Get images for this collection
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('*, staging_results (*)')
      .eq('collection_id', id)
      .order('uploaded_at', { ascending: false });

    if (imagesError) throw imagesError;

    return NextResponse.json({
      collection,
      images: images || [],
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/[id] - Delete a collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;

  try {
    const { error } = await supabase.from('collections').delete().eq('id', id);

    if (error) throw error;

    console.log(`🗑️ Collection deleted: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete collection' },
      { status: 500 }
    );
  }
}
