import { invalidate } from '@/hooks/use-api';
import { api } from '@/lib/api';

/** Follow / unfollow someone, then refresh every screen that shows follow state. */
export async function setFollowing(userId: string, follow: boolean) {
  await api('/api/follows/users', { method: follow ? 'POST' : 'DELETE', body: { userId } });
  invalidate('/api/friends');
  invalidate(`/api/users/`);
  invalidate('/api/follows/me');
}
