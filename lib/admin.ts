import { NextRequest } from 'next/server';
export function isAdmin(request: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  return Boolean(token && token.length >= 24 && request.headers.get('authorization') === `Bearer ${token}`);
}
