import type { LightboxState } from '../../types';

type LightboxProps = {
  image: NonNullable<LightboxState>;
  close: () => void;
};

export function Lightbox({ image, close }: LightboxProps) {
  return (
    <div className="lightbox" onClick={close}>
      <div className="lightbox-bar">
        <b>{image.title} · {image.label}</b>
        <button onClick={close}>关闭</button>
      </div>
      <img src={image.src} alt={`${image.title} ${image.label}`} onClick={(event) => event.stopPropagation()} />
    </div>
  );
}
