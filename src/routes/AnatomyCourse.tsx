import { Empty, PanelTitle } from '../components/ui/course-primitives';
import { useAppData } from '../lib/app-data';
import { compact, matches } from '../lib/search';
import type { AnatomyData, LightboxState, RouteConfig } from '../types';
import type { Dispatch, SetStateAction } from 'react';
import { ModuleRail, Table } from './shared';

export function AnatomyCourseRoute({ query, openLightbox, routes }: { query: string; openLightbox: Dispatch<SetStateAction<LightboxState>>; routes: RouteConfig[] }) {
  const data = useAppData();
  const anatomy = data.anatomy as AnatomyData | undefined;
  if (!anatomy) return <Empty text="暂无解剖数据" />;

  const jointRows = anatomy.jointToMuscles.filter((item) => matches(item, query));
  const galleries = anatomy.imageGalleries
    .map((gallery) => ({ ...gallery, images: gallery.images.filter((image) => matches({ gallery: gallery.title, image }, query)) }))
    .filter((gallery) => !query || matches(gallery, query) || gallery.images.length);

  return (
    <div className="course-layout">
      <div className="content-stack">
        <section className="panel">
          <PanelTitle title="关节与肌肉对照" subtitle="按关节活动理解主要参与肌群，并结合图谱查看拉伸位置。" />
          <div className="info-grid">
            {anatomy.intro.map((item) => <article className="info-tile" key={item.title}><b>{item.title}</b><span>{item.body}</span></article>)}
          </div>
          <Table headers={['关节', '动作', '说明', '示例', '肌肉']} rows={jointRows.map((row) => [row.joint, row.movement, row.description, row.example, row.muscles.join('、')])} />
          {anatomy.muscleSections.map((section) => (
            <details className="lesson-block" key={section.title}>
              <summary>{section.title}</summary>
              <Table headers={['关节', '动作', '说明', '肌肉 / 条目']} rows={section.rows.filter((row) => matches(row, query)).map((row) => [row.joint, row.movement, row.description, row.targets.map((target) => `${target.muscle}: ${target.item}`).join('、')])} />
            </details>
          ))}
        </section>
        {galleries.map((gallery) => (
          <section className="panel" key={gallery.id}>
            <PanelTitle title={gallery.title} subtitle={compact(gallery.note, 180)} />
            <div className="image-grid">
              {gallery.images.map((image) => (
                <figure className="image-card" key={image.src}>
                  <button onClick={() => openLightbox({ ...image, title: gallery.title })}><img src={image.src} alt={`${gallery.title} ${image.label}`} loading="lazy" /></button>
                  <figcaption>{image.label} · {image.anchor}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
      <ModuleRail moduleId="anatomy" routes={routes} />
    </div>
  );
}
