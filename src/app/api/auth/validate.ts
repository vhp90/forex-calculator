import { headers } from 'next/headers';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export async function validateAdminRequest(): Promise<boolean> {
  if (!ADMIN_TOKEN) {
    throw new Error('Admin token not configured');
  }

  const headersList = headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];
  return token === ADMIN_TOKEN;
}
