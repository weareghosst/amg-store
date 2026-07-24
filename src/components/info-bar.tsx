const STORE_ADDRESS = "Av. Lago Xarais 533 - Itaim Paulista, São Paulo - SP";
const STORE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS)}`;

const ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-brand-blue">
        <path
          d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    label: "Vendas em atacado e varejo",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-brand-blue">
        <path
          d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM6 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    label: "Entregas São Paulo, Grande São Paulo e Interior",
  },
];

export function InfoBar() {
  return (
    <div className="border-b border-slate-100 bg-white">
      <div className="h-1 bg-gradient-to-r from-brand-green via-brand-blue to-brand-navy" />
      <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-center gap-3 px-6 py-4 text-center"
          >
            {item.icon}
            <span className="text-sm font-medium text-slate-700">
              {item.label}
            </span>
          </div>
        ))}
        <a
          href={STORE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 px-6 py-4 text-center transition hover:bg-slate-50"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-brand-blue">
            <path
              d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <span className="text-sm font-medium text-brand-blue underline-offset-2 hover:underline">
            Retirada na loja
          </span>
        </a>
      </div>
    </div>
  );
}
