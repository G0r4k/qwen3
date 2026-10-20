import { useEffect, useMemo, useRef } from 'react';
import type { MenuData, Tema } from '../types';
import { renderMenuHTML } from '../lib/render';

interface Props {
  data: MenuData;
  tema: Tema;
  device?: 'auto' | 'mobile' | 'desktop';
}

export default function Preview({ data, tema, device = 'auto' }: Props) {
  const html = useMemo(() => renderMenuHTML(data, tema), [data, tema]);
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const f = ref.current;
    if (!f) return;
    f.srcdoc = html;
  }, [html]);

  const width = device === 'mobile' ? 390 : device === 'desktop' ? 1024 : '100%';

  return (
    <div className="h-full w-full flex justify-center overflow-auto bg-black/40 p-4">
      <div
        style={{ width: typeof width === 'number' ? width : undefined, maxWidth: '100%' }}
        className={device === 'mobile' ? 'h-[820px] max-h-full shrink-0 rounded-[2.5rem] border-[6px] border-zinc-800 shadow-2xl overflow-hidden' : 'w-full h-full'}
      >
        <iframe
          ref={ref}
          title="Preview del menú"
          className="w-full h-full rounded-xl border-0 bg-white"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
