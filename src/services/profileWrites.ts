import { stagingBackend } from './stagingBackend';

export async function saveProfileChanges(fields: {
  display_name?: string;
  bio?: string;
  avatar_url?: string | null;
}) {
  if (!stagingBackend) throw new Error('Staging is not configured');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Not authenticated');
  const patch: Record<string, string | null> = {};
  if (fields.display_name !== undefined) {
    const name = fields.display_name.trim();
    if (!name || name.length > 40) throw new Error('Invalid display name');
    patch.display_name = name;
  }
  if (fields.bio !== undefined) {
    if (fields.bio.length > 160) throw new Error('Bio too long');
    patch.bio = fields.bio;
  }
  if (fields.avatar_url !== undefined) {
    const url = fields.avatar_url;
    if (url !== null && (!url.startsWith('https://') || url.length > 600)) {
      throw new Error('Invalid avatar URL');
    }
    patch.avatar_url = url;
  }
  if (!Object.keys(patch).length) throw new Error('No supported fields');
  const { data, error } = await stagingBackend.from('profiles')
    .update(patch).eq('id', auth.user.id)
    .select('id,display_name,bio,avatar_url').single();
  if (error) throw error;
  return data;
}
