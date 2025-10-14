
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { navItemsByRole } from './sidebar-nav'; 
import React from 'react';
import { UserRole } from '@/lib/types';

const allNavItems = Object.values(navItemsByRole).flat();
const breadcrumbNameMap: { [key: string]: string } = {};
allNavItems.forEach(item => {
    breadcrumbNameMap[item.href] = item.label;
});
// Add manual entries for routes not in nav
breadcrumbNameMap['/dashboard'] = 'Dashboard';
breadcrumbNameMap['/dashboard/attendance'] = 'Asistencia Equipo';


export default function Breadcrumbs({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();

  if (pathname === '/dashboard') {
     return <div className="hidden md:block h-6" />;
  }

  const pathSegments = pathname.split('/').filter(segment => segment);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = breadcrumbNameMap[href];

    if (!label) {
      return null;
    }

    return { href, label };
  }).filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center">
      <ol className="flex items-center space-x-2 text-sm font-medium text-primary-foreground">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href}>
            <div className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
              <Link
                href={breadcrumb.href}
                className={`hover:underline ${index === breadcrumbs.length - 1 ? 'font-semibold opacity-100' : 'opacity-80'}`}
              >
                {breadcrumb.label}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
