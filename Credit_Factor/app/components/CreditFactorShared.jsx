const { useEffect: useCreditFactorSharedEffect, useRef: useCreditFactorSharedRef, useState: useCreditFactorSharedState } = React;

function CreditFactorDropdown({ label, options, value, onChange, placeholder = 'Select', sortOptions = true, emptyText = '' }) {
  const [open, setOpen] = useCreditFactorSharedState(false);
  const [menuStyle, setMenuStyle] = useCreditFactorSharedState(null);
  const wrapperRef = useCreditFactorSharedRef(null);
  const menuRef = useCreditFactorSharedRef(null);
  const normalizedOptions = (options || []).map((option) => {
    if (option && typeof option === 'object') {
      return {
        label: option.label ?? option.value ?? '',
        value: option.value ?? option.label ?? '',
      };
    }
    return { label: option, value: option };
  });
  const sortedOptions = sortOptions
    ? [...normalizedOptions].sort((a, b) => String(a.label).localeCompare(String(b.label)))
    : normalizedOptions;
  const dropdownSpace = Math.min(Math.max(normalizedOptions.length, 1) * 42 + 24, 240);
  const activeOption = sortedOptions.find((option) => String(option.value) === String(value));

  function requestDropdownResize() {
    setTimeout(() => window.CreditFactorWidget?.requestResize?.(), 0);
    setTimeout(() => window.CreditFactorWidget?.requestResize?.(), 200);
  }

  useCreditFactorSharedEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target) && menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useCreditFactorSharedEffect(() => {
    if (!open || !wrapperRef.current) {
      setMenuStyle(null);
      return undefined;
    }

    function updateMenuPosition() {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 2147483647,
      });
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open]);

  useCreditFactorSharedEffect(() => {
    window.CreditFactorWidget?.setDropdownSpace?.(open ? dropdownSpace : 0);
    requestDropdownResize();

    return () => {
      window.CreditFactorWidget?.setDropdownSpace?.(0);
      requestDropdownResize();
    };
  }, [open]);

  return (
    <div className={`relative z-[50] ${open ? 'z-[2147483647]' : ''}`} ref={wrapperRef}>
      {label && <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white flex items-center justify-between text-left"
      >
        <span className={value ? 'text-gray-700' : 'text-gray-400'}>{activeOption ? activeOption.label : value || placeholder}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 8 10 12 14 8" />
        </svg>
      </button>
      {open && menuStyle && ReactDOM.createPortal(
        <div
          ref={menuRef}
          className="rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto"
          style={menuStyle}
        >
          {!sortedOptions.length && emptyText && (
            <div className="px-3 py-2 text-sm text-gray-400">{emptyText}</div>
          )}
          {sortedOptions.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-indigo-50 ${
                String(opt.value) === String(value) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function CreditFactorStatCard({ title, value, note, badgeValue }) {
  const badge = badgeValue || value;
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <p className="text-xs font-semibold text-gray-700 mb-2">{title}</p>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center min-w-[40px] h-7 px-2 rounded-md bg-indigo-50 text-indigo-600 text-xs font-bold whitespace-nowrap">
          {badge}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-2">{note}</p>
    </div>
  );
}

window.CreditFactorDropdown = CreditFactorDropdown;
window.CreditFactorStatCard = CreditFactorStatCard;
