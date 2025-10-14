
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { navItemsByRole } from './sidebar-nav'; 
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import React from 'react';

const allNavItems = Object.values(navItemsByRole).flat();
const breadcrumbNameMap: { [key: string]: string } = {};
allNavItems.forEach(item => {
    breadcrumbNameMap[item.href] = item.label;
});
// Add manual entries for routes not in nav
breadcrumbNameMap['/dashboard'] = 'Dashboard';


export default function Breadcrumbs() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userData } = useDoc<AppUser>(userDocRef);

  const userRole = userData?.role || 'Miembro';

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
