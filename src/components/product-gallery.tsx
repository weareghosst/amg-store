"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const active = Math.min(index, Math.max(images.length - 1, 0));
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {images.length ? <Image src={images[active]} alt={`${name} — foto ${active + 1}`} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain" priority /> :
          <div className="grid h-full place-items-center text-slate-400">Sem foto</div>}
        {images.length > 1 && <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
          <button type="button" aria-label="Foto anterior" onClick={() => setIndex((active - 1 + images.length) % images.length)} className="h-10 w-10 rounded-full border border-slate-200 bg-white/95 text-brand-blue shadow-sm">‹</button>
          <span aria-live="polite" className="rounded-full bg-white/95 px-3 py-1 text-xs text-slate-600">{active + 1} de {images.length}</span>
          <button type="button" aria-label="Próxima foto" onClick={() => setIndex((active + 1) % images.length)} className="h-10 w-10 rounded-full border border-slate-200 bg-white/95 text-brand-blue shadow-sm">›</button>
        </div>}
      </div>
      {images.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto" aria-label="Fotos do produto">
        {images.map((url, i) => <button key={url} type="button" aria-label={`Ver foto ${i + 1} de ${name}`} aria-pressed={i === active} onClick={() => setIndex(i)} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-white ${i === active ? "border-brand-blue" : "border-slate-200"}`}>
          <Image src={url} alt="" fill sizes="80px" className="object-contain" />
        </button>)}
      </div>}
    </div>
  );
}
