import { useAppData } from '../../lib/app-data';
import type { RouteConfig } from '../../types';

type SidebarNavProps = {
  active: RouteConfig;
  routes: RouteConfig[];
  excelDownloadPath: string;
};

export function SidebarNav({ active, routes, excelDownloadPath }: SidebarNavProps) {
  return (
    <aside className="sidebar border-b border-white/10 lg:border-b-0 lg:border-r lg:border-r-white/10">
      <a className="brand group" href="#/">
        <span className="brand-mark">FK</span>
        <span>
          <strong>FitKnow</strong>
          <em>健身知识课</em>
        </span>
      </a>
      <nav className="nav-list" aria-label="主导航">
        {routes.map((item) => (
          <a key={item.id} className={item.id === active.id ? 'active' : ''} href={item.hash}>
            <span>{item.mark}</span>
            {item.label}
          </a>
        ))}
      </nav>
      <SourceSummary excelDownloadPath={excelDownloadPath} />
    </aside>
  );
}

type SourceSummaryProps = {
  excelDownloadPath: string;
};

function SourceSummary({ excelDownloadPath }: SourceSummaryProps) {
  const data = useAppData();

  return (
    <div className="source-box rounded-3xl border border-white/10 bg-white/5 p-4 shadow-none">
      <b>资料下载</b>
      <a href={excelDownloadPath} download>{data.source}</a>
      <small>更新：{new Date(data.generatedAt).toLocaleString('zh-CN')}</small>
    </div>
  );
}
