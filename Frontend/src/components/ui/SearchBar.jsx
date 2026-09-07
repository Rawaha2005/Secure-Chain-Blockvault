import { FaSearch, FaTimes } from "react-icons/fa";

function SearchBar({
  value,
  onChange,
  placeholder = "Search records, hashes, users...",
  onClear,
  filterOptions,
  activeFilter,
  onFilterChange,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      <div className="relative flex-1">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="cyber-input pl-11 pr-10 text-sm w-full py-2.5"
        />
        {value && (
          <button
            onClick={onClear || (() => onChange(""))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 text-sm"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {filterOptions && filterOptions.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {filterOptions.map((opt) => {
            const isActive = activeFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onFilterChange(opt.value)}
                className={`px-3 py-2 rounded-xl text-xs font-mono transition-all whitespace-nowrap border ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_12px_rgba(0,229,255,0.25)]"
                    : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
