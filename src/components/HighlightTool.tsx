'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { authorHighlights } from '@/lib/data';

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
  entryId: number;
  startOffset: number;
  endOffset: number;
  comments: CommentData[];
  isAuthor?: boolean;
}

const VIEWER_KEY = 'viewer-highlights';

function loadViewerHighlights(): HighlightData[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(VIEWER_KEY) || '[]'); }
  catch { return []; }
}

function saveViewerHighlights(data: HighlightData[]) {
  localStorage.setItem(VIEWER_KEY, JSON.stringify(data));
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HighlightLayer() {
  const [viewerHighlights, setViewerHighlights] = useState<HighlightData[]>([]);
  const [toolbar, setToolbar] = useState<{ x: number; y: number } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobilePopup, setMobilePopup] = useState<{ hlId: string; x: number; y: number } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [positions, setPositions] = useState<Record<string, number>>({});
  const pendingRef = useRef<{ text: string; entryId: number; startOffset: number } | null>(null);

  // Load viewer highlights from localStorage
  useEffect(() => {
    setViewerHighlights(loadViewerHighlights());
  }, []);

  // Merge author + viewer highlights
  const allHighlights: HighlightData[] = [
    ...authorHighlights.map((h) => ({ ...h, isAuthor: true })),
    ...viewerHighlights.map((h) => ({ ...h, isAuthor: false })),
  ];

  // Apply highlights to DOM and track positions
  const applyToDOM = useCallback(() => {
    document.querySelectorAll('[data-hl-id]').forEach((el) => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      parent.normalize();
    });

    const newPositions: Record<string, number> = {};

    for (const h of allHighlights) {
      const entryEl = document.querySelector(`[data-entry-id="${h.entryId}"]`);
      if (!entryEl) continue;

      const tw = document.createTreeWalker(entryEl, NodeFilter.SHOW_TEXT);
      let charsSeen = 0;
      let tn: Text | null;

      while ((tn = tw.nextNode() as Text | null)) {
        const len = tn.textContent?.length || 0;
        const nodeStart = charsSeen;
        const nodeEnd = charsSeen + len;

        if (nodeStart < h.endOffset && nodeEnd > h.startOffset) {
          const from = Math.max(h.startOffset - nodeStart, 0);
          const to = Math.min(h.endOffset - nodeStart, len);

          try {
            const r = document.createRange();
            r.setStart(tn, from);
            r.setEnd(tn, to);

            const span = document.createElement('span');
            span.dataset.hlId = h.id;
            span.style.backgroundColor = h.bg;
            span.style.borderRadius = '2px';
            span.style.padding = '0 1px';
            span.style.cursor = 'pointer';
            span.style.position = 'relative';
            r.surroundContents(span);

            // Add comment count badge for mobile (hidden on lg+)
            if (h.comments.length > 0) {
              const badge = document.createElement('span');
              badge.className = 'hl-badge lg:!hidden';
              badge.textContent = `${h.comments.length}`;
              badge.dataset.hlId = h.id;
              span.appendChild(badge);
            }

            const rect = span.getBoundingClientRect();
            const container = document.querySelector('[data-metalog-container]');
            const containerRect = container?.getBoundingClientRect();
            if (containerRect) {
              newPositions[h.id] = rect.top - containerRect.top;
            }
          } catch { /* skip */ }
          break;
        }
        charsSeen += len;
      }
    }

    setPositions(newPositions);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerHighlights]);

  useEffect(() => {
    const timer = setTimeout(applyToDOM, 50);
    return () => clearTimeout(timer);
  }, [applyToDOM]);

  useEffect(() => {
    const recalc = () => {
      const newPositions: Record<string, number> = {};
      for (const h of allHighlights) {
        const span = document.querySelector(`[data-hl-id="${h.id}"]`);
        const container = document.querySelector('[data-metalog-container]');
        if (span && container) {
          const rect = span.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          newPositions[h.id] = rect.top - containerRect.top;
        }
      }
      setPositions(newPositions);
    };
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerHighlights]);

  // Text selection
  useEffect(() => {
    const onMouseUp = () => {
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
          setToolbar(null);
          pendingRef.current = null;
          return;
        }

        const range = sel.getRangeAt(0);
        const text = sel.toString().trim();
        if (!text) { setToolbar(null); return; }

        let node: Node | null = range.startContainer;
        let entryEl: HTMLElement | null = null;
        while (node) {
          if (node instanceof HTMLElement && node.dataset.entryId) {
            entryEl = node;
            break;
          }
          node = node.parentNode;
        }
        if (!entryEl) { setToolbar(null); return; }

        const entryId = parseInt(entryEl.dataset.entryId!);
        const tw = document.createTreeWalker(entryEl, NodeFilter.SHOW_TEXT);
        let offset = 0;
        let tn: Node | null;
        while ((tn = tw.nextNode())) {
          if (tn === range.startContainer) {
            offset += range.startOffset;
            break;
          }
          offset += (tn.textContent || '').length;
        }

        pendingRef.current = { text, entryId, startOffset: offset };
        const rect = range.getBoundingClientRect();
        setToolbar({ x: rect.left + rect.width / 2, y: rect.top - 10 });
      }, 10);
    };

    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const hlEl = target.closest('[data-hl-id]') as HTMLElement | null;
      if (hlEl && hlEl.dataset.hlId) {
        const id = hlEl.dataset.hlId;
        // On mobile (< 1024px), show popup
        if (window.innerWidth < 1024) {
          const rect = hlEl.getBoundingClientRect();
          setMobilePopup({ hlId: id, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
        } else {
          setActiveId(id);
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
      entryId: p.entryId,
      startOffset: p.startOffset,
      endOffset: p.startOffset + p.text.length,
      comments: [],
      isAuthor: false,
    };

    const next = [...viewerHighlights, h];
    setViewerHighlights(next);
    saveViewerHighlights(next);
    setActiveId(h.id);
    setToolbar(null);
    pendingRef.current = null;
    window.getSelection()?.removeAllRanges();
  }

  function addComment(hlId: string, text: string) {
    const comment: CommentData = { id: `c-${Date.now()}`, text, timestamp: Date.now() };

    // Only viewer highlights can receive new comments
    const next = viewerHighlights.map((h) =>
      h.id === hlId ? { ...h, comments: [...h.comments, comment] } : h
    );
    setViewerHighlights(next);
    saveViewerHighlights(next);
  }

  const sorted = [...allHighlights].sort((a, b) => (positions[a.id] || 0) - (positions[b.id] || 0));

  return (
    <>
      {toolbar && (
        <div
          className="hl-toolbar fixed z-50 hidden lg:flex gap-1.5 bg-[#111] border border-gray-700 rounded px-2 py-1.5"
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

      {/* Mobile popup */}
      {mobilePopup && (() => {
        const h = allHighlights.find((hl) => hl.id === mobilePopup.hlId);
        if (!h || h.comments.length === 0) return null;
        return (
          <div
            className="fixed z-50 lg:hidden bg-[#111] border border-gray-700 rounded px-3 py-2 max-w-[260px]"
            style={{ left: mobilePopup.x, top: mobilePopup.y, transform: 'translateX(-50%)' }}
          >
            <div className="text-[9px] text-gray-600 truncate mb-1">
              &ldquo;{h.text.slice(0, 40)}{h.text.length > 40 ? '...' : ''}&rdquo;
            </div>
            {h.comments.map((c) => (
              <div key={c.id} className="text-[10px] text-gray-400 leading-[1.5] mt-1">
                {c.text}
              </div>
            ))}
          </div>
        );
      })()}

      <aside className="w-56 shrink-0 relative hidden lg:block" data-sidebar>
        {sorted.map((h) => {
          const top = positions[h.id];
          if (top === undefined) return null;
          const isOpen = h.id === activeId;
          const isAuthor = h.isAuthor;

          return (
            <div
              key={h.id}
              className="absolute left-0 w-full cursor-pointer"
              style={{ top }}
              onClick={() => setActiveId(isOpen ? null : h.id)}
            >
              <div
                className="border-l-2 pl-3 py-1"
                style={{ borderColor: h.color }}
              >
                <div className="flex items-baseline gap-1">
                  {isAuthor && (
                    <span className="text-[7px] text-gray-600 uppercase tracking-wider">kerem</span>
                  )}
                  <span className="text-[9px] text-gray-600 truncate">
                    &ldquo;{h.text.slice(0, 35)}{h.text.length > 35 ? '...' : ''}&rdquo;
                  </span>
                </div>

                {h.comments.map((c) => (
                  <div key={c.id} className="text-[10px] text-gray-400 leading-[1.5] mt-1 pl-2 border-l border-gray-800">
                    <span className="text-[8px] text-gray-600">{fmtTime(c.timestamp)}</span>
                    <div>{c.text}</div>
                  </div>
                ))}

                {/* Only viewer highlights get comment input */}
                {isOpen && !isAuthor && (
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
