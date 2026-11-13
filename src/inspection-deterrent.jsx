import React, {useEffect,useState} from 'react';

export function InspectionDeterrent() {
  const [showNotice,setShowNotice] = useState(false);

  useEffect(() => {
    let noticeTimer;
    const blockMenu = event => event.preventDefault();
    const blockShortcut = event => {
      const key = event.key.toLowerCase();
      const toolsModifier = (event.ctrlKey && event.shiftKey) || (event.metaKey && event.altKey);
      if (key !== 'f12' && !(toolsModifier && ['c','i','j','k'].includes(key))) return;
      event.preventDefault();
      event.stopPropagation();
      setShowNotice(true);
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => setShowNotice(false), 3000);
    };

    window.addEventListener('contextmenu',blockMenu,true);
    window.addEventListener('keydown',blockShortcut,true);
    return () => {
      clearTimeout(noticeTimer);
      window.removeEventListener('contextmenu',blockMenu,true);
      window.removeEventListener('keydown',blockShortcut,true);
    };
  }, []);

  return <div className="atlas-inspection-notice" role="status">
    {showNotice && <span>Inspection shortcuts are disabled on this page.</span>}
  </div>;
}
