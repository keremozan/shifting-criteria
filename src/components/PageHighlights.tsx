'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = [
  { name: 'yellow', bg: 'rgba(250, 204, 21, 0.4)', border: '#facc15' },
  { name: 'blue', bg: 'rgba(96, 165, 250, 0.35)', border: '#60a5fa' },
  { name: 'green', bg: 'rgba(74, 222, 128, 0.35)', border: '#4ade80' },
  { name: 'red', bg: 'rgba(248, 113, 113, 0.35)', border: '#f87171' },
  { name: 'purple', bg: 'rgba(167, 139, 250, 0.35)', border: '#a78bfa' },
];

interface CommentData {
  id: string;
  text: string;
  timestamp: number;
}

interface HighlightData {
  id: string;
  text: string;
  color: string;
  bg: string;
  sectionId: string;
  startOffset: number;
  endOffset: number;
  comments: CommentData[];
  isAuthor?: boolean;
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  pageKey: string;
  authorHighlights?: HighlightData[];
}

export default function PageHighlights({ pageKey, authorHighlights = [] }: Props) {
  const storageKey = `highlights-${pageKey}`;
  const [viewerHL, setViewerHL] = useState<HighlightData[]>([]);
  const [toolbar, setToolbar] = useState<{ x: number; y: number } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobilePopup, setMobilePopup] = useState<{ hlId: string; x: number; y: number } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [positions, setPositions] = useState<Record<string, number>>({});
  const pendingRef = useRef<{ text: string; sectionId: string; startOffset: number } | null>(null);

  useEffect(() => {
    try { setViewerHL(JSON.parse(localStorage.getItem(storageKey) || '[]')); }
    catch { /* */ }
  }, [storageKey]);

  const allHL: HighlightData[] = [
    ...authorHighlights.map((h) => ({ ...h, isAuthor: true })),
    ...viewerHL.map((h) => ({ ...h, isAuthor: false })),
  ];

  const applyToDOM = useCallback(() => {
    document.querySelectorAll(`[data-phl-${pageKey}]`).forEach((el) => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      parent.normalize();
    });

    const newPos: Record<string, number> = {};

    for (const h of allHL) {
      const el = document.querySelector(`[data-section-id="${h.sectionId}"]`);
      if (!el) continue;

      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let chars = 0;
      let tn: Text | null;

      while ((tn = tw.nextNode() as Text | null)) {
        const len = tn.textContent?.length || 0;
        if (chars < h.endOffset && chars + len > h.startOffset) {
          const from = Math.max(h.startOffset - chars, 0);
          const to = Math.min(h.endOffset - chars, len);
          try {
            const r = document.createRange();
            r.setStart(tn, from);
            r.setEnd(tn, to);
            const span = document.createElement('span');
            span.setAttribute(`data-phl-${pageKey}`, h.id);
            span.dataset.hlId = h.id;
            span.style.backgroundColor = h.bg;
            span.style.borderRadius = '2px';
            span.style.padding = '0 1px';
            span.style.cursor = 'pointer';
            span.style.position = 'relative';
            r.surroundContents(span);

            if (h.comments.length > 0) {
              const badge = document.createElement('span');
              badge.className = 'hl-badge lg:!hidden';
              badge.textContent = `${h.comments.length}`;
              span.appendChild(badge);
            }

            const container = document.querySelector(`[data-page-container="${pageKey}"]`);
            const rect = span.getBoundingClientRect();
            const containerRect = container?.getBoundingClientRect();
            if (containerRect) newPos[h.id] = rect.top - containerRect.top;
          } catch { /* */ }
          break;
        }
        chars += len;
      }
    }
    setPositions(newPos);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerHL, pageKey]);

  useEffect(() => {
    const t = setTimeout(applyToDOM, 50);
    return () => clearTimeout(t);
  }, [applyToDOM]);

  // Text selection
  useEffect(() => {
    const onMouseUp = () => {
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) { setToolbar(null); return; }
        const range = sel.getRangeAt(0);
        const text = sel.toString().trim();
        if (!text) { setToolbar(null); return; }

        let node: Node | null = range.startContainer;
        let sectionEl: HTMLElement | null = null;
        while (node) {
          if (node instanceof HTMLElement && node.dataset.sectionId) { sectionEl = node; break; }
          node = node.parentNode;
        }
        if (!sectionEl) { setToolbar(null); return; }

        const sectionId = sectionEl.dataset.sectionId!;
        const tw = document.createTreeWalker(sectionEl, NodeFilter.SHOW_TEXT);
        let offset = 0;
        let tn: Node | null;
        while ((tn = tw.nextNode())) {
          if (tn === range.startContainer) { offset += range.startOffset; break; }
          offset += (tn.textContent || '').length;
        }

        pendingRef.current = { text, sectionId, startOffset: offset };
        const rect = range.getBoundingClientRect();
        setToolbar({ x: rect.left + rect.width / 2, y: rect.top - 10 });
      }, 10);
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []);

  // Click on highlight
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const hlEl = target.closest('[data-hl-id]') as HTMLElement | null;
      if (hlEl && hlEl.dataset.hlId) {
        if (window.innerWidth < 1024) {
          const rect = hlEl.getBoundingClientRect();
          setMobilePopup({ hlId: hlEl.dataset.hlId, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
        } else {
          setActiveId(hlEl.dataset.hlId);
        }
      } else if (mobilePopup) {
        setMobilePopup(null);
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [mobilePopup]);

  function doHighlight(colorIdx: number) {
    const p = pendingRef.current;
    if (!p) return;
    const c = COLORS[colorIdx];
    const h: HighlightData = {
      id: `vhl-${Date.now()}`,
      text: p.text,
      color: c.border,
      bg: c.bg,
      sectionId: p.sectionId,
      startOffset: p.startOffset,
      endOffset: p.startOffset + p.text.length,
      comments: [],
    };
    const next = [...viewerHL, h];
    setViewerHL(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setActiveId(h.id);
    setToolbar(null);
    pendingRef.current = null;
    window.getSelection()?.removeAllRanges();
  }

  function addComment(hlId: string, text: string) {
    const comment: CommentData = { id: `c-${Date.now()}`, text, timestamp: Date.now() };
    const next = viewerHL.map((h) => h.id === hlId ? { ...h, comments: [...h.comments, comment] } : h);
    setViewerHL(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  const sorted = [...allHL].sort((a, b) => (positions[a.id] || 0) - (positions[b.id] || 0));

  return (
    <>
      {toolbar && (
        <div
          className="fixed z-50 hidden lg:flex gap-1.5 bg-[#111] border border-gray-700 rounded px-2 py-1.5"
          style={{ left: toolbar.x, top: toolbar.y, transform: 'translate(-50%, -100%)' }}
        >
          {COLORS.map((c, i) => (
            <button
              key={c.name}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); doHighlight(i); }}
              className="w-4 h-4 rounded-full cursor-pointer hover:scale-125 transition-transform"
              style={{ backgroundColor: c.border }}
            />
          ))}
        </div>
      )}

      {mobilePopup && (() => {
        const h = allHL.find((hl) => hl.id === mobilePopup.hlId);
        if (!h || h.comments.length === 0) return null;
        return (
          <div
            className="fixed z-50 lg:hidden bg-[#111] border border-gray-700 rounded px-3 py-2 max-w-[260px]"
            style={{ left: mobilePopup.x, top: mobilePopup.y, transform: 'translateX(-50%)' }}
          >
            {h.comments.map((c) => (
              <div key={c.id} className="text-[10px] text-gray-400 leading-[1.5] mt-1">{c.text}</div>
            ))}
          </div>
        );
      })()}

      <aside className="w-52 shrink-0 relative hidden lg:block">
        {sorted.map((h) => {
          const top = positions[h.id];
          if (top === undefined) return null;
          const isOpen = h.id === activeId;
          return (
            <div
              key={h.id}
              className="absolute left-0 w-full cursor-pointer"
              style={{ top }}
              onClick={() => setActiveId(isOpen ? null : h.id)}
            >
              <div className="border-l-2 pl-3 py-1" style={{ borderColor: h.color }}>
                <div className="flex items-baseline gap-1">
                  {h.isAuthor && <span className="text-[7px] text-gray-600 uppercase tracking-wider">kerem</span>}
                  <span className="text-[9px] text-gray-600 truncate">
                    &ldquo;{h.text.slice(0, 30)}{h.text.length > 30 ? '...' : ''}&rdquo;
                  </span>
                </div>
                {h.comments.map((c) => (
                  <div key={c.id} className="text-[10px] text-gray-400 leading-[1.5] mt-1 pl-2 border-l border-gray-800">
                    <span className="text-[8px] text-gray-600">{fmtTime(c.timestamp)}</span>
                    <div>{c.text}</div>
                  </div>
                ))}
                {isOpen && !h.isAuthor && (
                  <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={drafts[h.id] || ''}
                      onChange={(e) => setDrafts({ ...drafts, [h.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && drafts[h.id]?.trim()) {
                          addComment(h.id, drafts[h.id].trim());
                          setDrafts({ ...drafts, [h.id]: '' });
                        }
                      }}
                      placeholder="comment..."
                      className="w-full bg-transparent border border-gray-700 rounded px-2 py-0.5 text-[10px] text-gray-300 placeholder-gray-600 outline-none focus:border-gray-600"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </aside>
    </>
  );
}
