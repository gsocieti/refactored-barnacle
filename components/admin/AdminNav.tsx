import Link from 'next/link';
import { logout } from '@/app/admin/actions';

export default function AdminNav({ current }: { current: 'menu' | 'users' }) {
  const link = (href: string, label: string, key: 'menu' | 'users') => (
    <Link
      href={href}
      aria-current={current === key ? 'page' : undefined}
      className={`rounded-full border-2 border-kuah px-4 py-1.5 font-semibold ${current === key ? 'bg-kuah text-white' : 'bg-white'}`}
    >
      {label}
    </Link>
  );
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <nav className="flex gap-2">
        {link('/admin', 'Menu', 'menu')}
        {link('/admin/users', 'Admin', 'users')}
      </nav>
      <form action={logout}>
        <button type="submit" className="btn bg-white px-4 py-2">Keluar</button>
      </form>
    </header>
  );
}
