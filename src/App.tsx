import { useEffect, useState } from 'react';
import { Lightbox } from './components/layout/Lightbox';
import { Shell } from './components/layout/Shell';
import { Empty, PageLoading } from './components/ui/course-primitives';
import { DataContext } from './lib/app-data';
import type { AppData } from './lib/app-data';
import { coreLoader, routeFromHash, routeLoaders } from './lib/data-loaders';
import { AnatomyCourseRoute } from './routes/AnatomyCourse';
import { DashboardRoute } from './routes/DashboardRoute';
import { DietCourseRoute } from './routes/DietCourse';
import { FoodsCourseRoute } from './routes/FoodsCourse';
import { QaCourseRoute } from './routes/QaCourse';
import { SourceIndexRoute } from './routes/SourceIndexRoute';
import { ToolsCourseRoute } from './routes/ToolsCourse';
import { TrainingCourseRoute } from './routes/TrainingCourse';
import type { LightboxState, RouteConfig, RouteDataPayload, RouteDataState, RouteId } from './types';

const routes: RouteConfig[] = [
  { id: 'dashboard', hash: '#/', label: '总览', mark: '01' },
  { id: 'fat-loss', hash: '#/fat-loss', label: '减脂饮食', mark: '02' },
  { id: 'muscle-gain', hash: '#/muscle-gain', label: '增肌饮食', mark: '03' },
  { id: 'training', hash: '#/training', label: '训练计划', mark: '04' },
  { id: 'tools', hash: '#/tools', label: '热量工具', mark: '05' },
  { id: 'foods', hash: '#/foods', label: '食物营养', mark: '06' },
  { id: 'qa', hash: '#/qa', label: '问答库', mark: '07' },
  { id: 'anatomy', hash: '#/anatomy', label: '拉伸解剖', mark: '08' },
  { id: 'source', hash: '#/source', label: '资料下载', mark: '09' },
];

const excelDownloadPath = '/generated/assets/【可任意分享】健身Excel超级套表（作者：B站好人松松）26年4月最新版.xlsx';

function NotFound() {
  return (
    <div className="not-found mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center">
      <h2>404</h2>
      <p>页面不存在</p>
      <a href="#/">返回首页</a>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState<RouteId>(routeFromHash() as RouteId);
  const [query, setQuery] = useState('');
  const [lightbox, setLightbox] = useState<LightboxState>(null);
  const [coreData, setCoreData] = useState<AppData | { loadError?: Error } | null>(null);
  const [routeData, setRouteData] = useState<RouteDataState>({ routeKey: null, queryKey: null, payload: {} });
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash() as RouteId);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setLightbox(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let active = true;
    coreLoader().then((data) => {
      if (active) setCoreData(data);
    }).catch((error) => {
      console.error('Failed to load core data', error);
      if (active) setCoreData({ loadError: error });
    });
    return () => {
      active = false;
    };
  }, []);

  const active = routes.find((item) => item.id === route);
  const routeKey: RouteId = active?.id || 'dashboard';
  const queryKey = routeKey === 'dashboard' ? query.trim() : '';

  useEffect(() => {
    let activeLoad = true;
    const loader = routeLoaders[routeKey] || routeLoaders.dashboard;
    setIsLoadingData(true);
    loader({ query }).then((data) => {
      if (!activeLoad) return;
      setRouteData({ routeKey, queryKey, payload: data });
      setIsLoadingData(false);
    }).catch((error) => {
      console.error('Failed to load route data', error);
      if (!activeLoad) return;
      setRouteData({ routeKey, queryKey, payload: { loadError: error } });
      setIsLoadingData(false);
    });
    return () => {
      activeLoad = false;
    };
  }, [routeKey, queryKey]);

  const hasCoreData = !!coreData && 'generatedAt' in coreData;
  if (!hasCoreData || coreData.loadError) {
    return <PageLoading text={coreData?.loadError ? '核心数据加载失败，请刷新页面或检查生成文件。' : '正在加载 FitKnow 数据…'} />;
  }

  const hasCurrentRouteData = routeData.routeKey === routeKey && routeData.queryKey === queryKey;
  const currentRouteData: RouteDataPayload = hasCurrentRouteData ? routeData.payload : {};
  const isRouteLoading = isLoadingData || !hasCurrentRouteData;
  const data: AppData = { ...coreData, ...currentRouteData };
  if (!active) {
    return (
      <DataContext.Provider value={data}>
        <Shell active={routes[0]} query={query} setQuery={setQuery} routes={routes} excelDownloadPath={excelDownloadPath}>
          <NotFound />
        </Shell>
      </DataContext.Provider>
    );
  }

  return (
    <DataContext.Provider value={data}>
      <Shell active={active} query={query} setQuery={setQuery} routes={routes} excelDownloadPath={excelDownloadPath}>
        {isRouteLoading && <PageLoading text="正在加载本页数据…" />}
        {!isRouteLoading && currentRouteData.loadError && <Empty text="本页数据加载失败，请刷新重试。" />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'dashboard' && <DashboardRoute query={query} routes={routes} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'fat-loss' && <DietCourseRoute goal="fat-loss" query={query} routes={routes} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'muscle-gain' && <DietCourseRoute goal="muscle-gain" query={query} routes={routes} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'training' && <TrainingCourseRoute query={query} routes={routes} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'tools' && <ToolsCourseRoute routes={routes} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'foods' && <FoodsCourseRoute query={query} routes={routes} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'qa' && <QaCourseRoute query={query} routes={routes} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'anatomy' && <AnatomyCourseRoute query={query} openLightbox={setLightbox} routes={routes} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'source' && <SourceIndexRoute routes={routes} excelDownloadPath={excelDownloadPath} />}
      </Shell>
      {lightbox && <Lightbox image={lightbox} close={() => setLightbox(null)} />}
    </DataContext.Provider>
  );
}

export default App;
