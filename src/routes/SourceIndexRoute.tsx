import { PanelTitle } from '../components/ui/course-primitives';
import { useAppData } from '../lib/app-data';
import type { RouteConfig } from '../types';
import { ModuleRail } from './shared';

export function SourceIndexRoute({ routes, excelDownloadPath }: { routes: RouteConfig[]; excelDownloadPath: string }) {
  const data = useAppData();

  return (
    <div className="course-layout">
      <div className="content-stack">
        <section className="panel download-panel">
          <PanelTitle title="资料下载" subtitle="下载原版表格资料，配合站内课程一起使用。" />
          <div className="download-card">
            <div>
              <p className="section-label">原版资料</p>
              <h3>{data.source}</h3>
              <p>站内内容已整理成饮食、训练、工具和问答模块；需要查看完整资料时，可以下载原版文件。</p>
              <small>更新：{new Date(data.generatedAt).toLocaleString('zh-CN')}</small>
            </div>
            <a className="primary-button" href={excelDownloadPath} download>下载 Excel</a>
          </div>
        </section>
      </div>
      <ModuleRail moduleId="source" routes={routes} />
    </div>
  );
}
