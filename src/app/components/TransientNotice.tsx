/**
 * Accessible transient notice for rejected graph edits and similar explanations.
 * One live region for all rejections (Slice 6); auto-clears after a short pause.
 */
import { useEffect } from "react";
import { useStore } from "../../state/store";

const NOTICE_MS = 4500;

export function TransientNotice() {
  const notice = useStore((s) => s.notice);
  const noticeId = useStore((s) => s.noticeId);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => {
      const s = useStore.getState();
      if (s.noticeId === noticeId) s.setNotice(null);
    }, NOTICE_MS);
    return () => window.clearTimeout(t);
  }, [notice, noticeId]);

  if (!notice) return null;
  return (
    <div className="transient-notice" role="status" aria-live="assertive">
      {notice}
    </div>
  );
}
