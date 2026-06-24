import type { ReactNode } from 'react';

import type { RouteConfig } from '../../types';
import { HeaderSearch } from './HeaderSearch';
import { SidebarNav } from './SidebarNav';

type ShellProps = {
  active: RouteConfig;
  query: string;
  setQuery: (value: string) => void;
  children: ReactNode;
  routes: RouteConfig[];
  excelDownloadPath: string;
};

export function Shell({ active, query, setQuery, children, routes, excelDownloadPath }: ShellProps) {
  return (
    <div className="app-shell min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <SidebarNav active={active} routes={routes} excelDownloadPath={excelDownloadPath} />
      <div className="workspace min-w-0">
        <HeaderSearch active={active} query={query} onQueryChange={setQuery} />
        <main key={active.id} className="page-enter min-w-0 px-4 py-5 sm:px-6 sm:py-7">{children}</main>
      </div>
    </div>
  );
}
