const { useEffect: useCreditFactorSharedEffect, useRef: useCreditFactorSharedRef, useState: useCreditFactorSharedState } = React;

function CreditFactorIcon({ name, size = 16, className = '' }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': 'true',
  };

  const icons = {
    report: (
      <svg {...commonProps}>
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
        <path d="M14 2v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    ),
    chart: (
      <svg {...commonProps}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15v-4" />
        <path d="M12 15V8" />
        <path d="M16 15v-6" />
      </svg>
    ),
    bureau: (
      <svg {...commonProps}>
        <path d="M3 21h18" />
        <path d="M5 21V8l7-5 7 5v13" />
        <path d="M9 21v-6h6v6" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
      </svg>
    ),
    calendar: (
      <svg {...commonProps}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
    filter: (
      <svg {...commonProps}>
        <path d="M4 5h16" />
        <path d="M7 12h10" />
        <path d="M10 19h4" />
      </svg>
    ),
    send: (
      <svg {...commonProps}>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    ),
    changes: (
      <svg {...commonProps}>
        <path d="M4 7h11" />
        <path d="m12 4 3 3-3 3" />
        <path d="M20 17H9" />
        <path d="m12 14-3 3 3 3" />
      </svg>
    ),
    account: (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </svg>
    ),
    card: (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h3" />
        <path d="M14 15h3" />
      </svg>
    ),
    money: (
      <svg {...commonProps}>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M6 9v.01" />
        <path d="M18 15v.01" />
      </svg>
    ),
    currency: (
      <svg {...commonProps}>
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    note: (
      <svg {...commonProps}>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </svg>
    ),
    dispute: (
      <svg {...commonProps}>
        <path d="M12 3 3 7l9 4 9-4-9-4Z" />
        <path d="M3 17l9 4 9-4" />
        <path d="M3 12l9 4 9-4" />
      </svg>
    ),
    file: (
      <svg {...commonProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
    id: (
      <svg {...commonProps}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 10h.01" />
        <path d="M12 10h5" />
        <path d="M8 14h9" />
      </svg>
    ),
    clock: (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    history: (
      <svg {...commonProps}>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    shield: (
      <svg {...commonProps}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      </svg>
    ),
    percent: (
      <svg {...commonProps}>
        <path d="m19 5-14 14" />
        <circle cx="7" cy="7" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
  };

  return icons[name] || icons.report;
}

function CreditFactorDropdown({ label, icon, options, value, onChange, placeholder = 'Select', sortOptions = true, emptyText = '' }) {
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
      {label && (
        <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-600">
          {icon && <CreditFactorIcon name={icon} size={14} className="text-gray-400" />}
          {label}
        </label>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white flex items-center justify-between text-left"
      >
        <span className={`min-w-0 truncate ${value ? 'text-gray-700' : 'text-gray-400'}`}>{activeOption ? activeOption.label : value || placeholder}</span>
        <CreditFactorIcon name="filter" size={15} className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
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

function getCreditFactorStatIcon(title) {
  const normalized = String(title || '').toLowerCase();
  if (normalized.includes('inquiries')) return 'filter';
  if (normalized.includes('accounts')) return 'account';
  if (normalized.includes('age')) return 'history';
  if (normalized.includes('derogatory')) return 'shield';
  if (normalized.includes('card')) return 'card';
  if (normalized.includes('payment')) return 'currency';
  return 'chart';
}

function getCreditFactorStatTheme(title) {
  const normalized = String(title || '').toLowerCase();
  if (normalized.includes('inquiries')) {
    return {
      iconWrap: 'text-amber-500',
      badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
      accent: 'from-amber-50/80',
    };
  }
  if (normalized.includes('accounts')) {
    return {
      iconWrap: 'text-sky-500',
      badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
      accent: 'from-sky-50/80',
    };
  }
  if (normalized.includes('age')) {
    return {
      iconWrap: 'text-violet-500',
      badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
      accent: 'from-violet-50/80',
    };
  }
  if (normalized.includes('derogatory')) {
    return {
      iconWrap: 'text-rose-500',
      badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
      accent: 'from-rose-50/80',
    };
  }
  if (normalized.includes('card')) {
    return {
      iconWrap: 'text-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
      accent: 'from-emerald-50/80',
    };
  }
  if (normalized.includes('payment')) {
    return {
      iconWrap: 'text-indigo-500',
      badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
      accent: 'from-indigo-50/80',
    };
  }
  return {
    iconWrap: 'text-gray-500',
    badge: 'bg-gray-100 text-gray-800 ring-1 ring-gray-200',
    accent: 'from-gray-50',
  };
}

function CreditFactorStatCard({ title, value, note, badgeValue, icon }) {
  const badge = badgeValue || value;
  const iconName = icon || getCreditFactorStatIcon(title);
  const theme = getCreditFactorStatTheme(title);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${theme.accent} via-white to-white rounded-xl border border-gray-200 px-5 py-5`}>
      <span className={`pointer-events-none absolute right-4 top-5 z-0 inline-flex h-24 w-24 items-center justify-center opacity-20 ${theme.iconWrap}`}>
        <CreditFactorIcon name={iconName} size={92} />
      </span>
      <div className="relative z-10 mb-7 flex items-center pr-16">
        <p className="text-md font-semibold text-gray-700">{title}</p>
      </div>
      <div className="relative z-10 flex items-end gap-2">
        <span className={`inline-flex min-h-11 min-w-[64px] items-center justify-center rounded-xl px-3 text-xl font-extrabold leading-none tracking-tight whitespace-nowrap ${theme.badge}`}>
          {badge}
        </span>
      </div>
      <p className="relative z-10 mt-5 text-sm leading-6 text-gray-500">{note}</p>
    </div>
  );
}

window.CreditFactorDropdown = CreditFactorDropdown;
window.CreditFactorStatCard = CreditFactorStatCard;
window.CreditFactorIcon = CreditFactorIcon;
