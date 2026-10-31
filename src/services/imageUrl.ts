import { stagingBackend } from './stagingBackend';

/** Display URLs for the public image buckets; never return a raw storage path. */
export function imageUrl(value:string|null|undefined,bucket:'profile-avatars'|'totichat-room-images'|'totichat-admin-banners'='profile-avatars'):string {
  const input=(value||'').trim();
  if(!input)return '';
  if(/^(https?:\/\/|data:image\/|blob:)/i.test(input))return input;
  if(!stagingBackend)return '';
  let path=input;
  const marker='/storage/v1/object/';
  if(input.includes(marker))return input;
  path=path.replace(/^\/+/, '');
  if(path.startsWith(bucket+'/'))path=path.slice(bucket.length+1);
  return stagingBackend.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
