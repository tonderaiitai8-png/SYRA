import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter } from 'lucide-react';

interface SearchFilterProps {
  items: any[];
  searchFields: string[];
  filterOptions?: {
    label: string;
    field: string;
    values: string[];
  }[];
}

export function SearchFilter({
  items,
  searchFields,
  filterOptions = [],
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});
  const [showFilters, setShowFilters] = useState(false);

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        searchFields.some((field) => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], item);
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([field, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter((item) => {
          const itemValue = field.split('.').reduce((obj, key) => obj?.[key], item);
          return values.some((val) =>
            itemValue?.toString().toLowerCase().includes(val.toLowerCase())
          );
        });
      }
    });

    return filtered;
  }, [items, searchQuery, activeFilters, searchFields]);



  const handleFilterToggle = (field: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[field] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
  };

  const activeFilterCount = Object.values(activeFilters).flat().length;

  return (
    <div className="space-y-4" role="search">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu items..."
            className="input-professional pr-12"
            aria-label="Search menu items"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-neutral-light hover:text-neutral transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <Search className="w-5 h-5 text-neutral-light" aria-hidden="true" />
          </div>
        </div>

        {filterOptions.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-professional px-4 py-3 glass-professional rounded-xl hover:bg-primary-500/10 transition-all duration-200 flex items-center gap-2 relative active:scale-95"
            aria-label="Toggle filters"
            aria-expanded={showFilters}
          >
            <Filter className="w-5 h-5" aria-hidden="true" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showFilters && filterOptions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-professional p-4 rounded-xl space-y-4 border border-white/20">
              {filterOptions.map((option) => (
                <div key={option.field}>
                  <p className="text-sm font-semibold text-neutral mb-2">{option.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) => {
                      const isActive = activeFilters[option.field]?.includes(value);
                      return (
                        <button
                          key={value}
                          onClick={() => handleFilterToggle(option.field, value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                            isActive
                              ? 'bg-primary-500 text-white shadow-md'
                              : 'glass-professional hover:bg-primary-500/10'
                          }`}
                          aria-pressed={isActive}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full btn-professional px-4 py-2 text-sm text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all duration-200"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(searchQuery || activeFilterCount > 0) && (
        <p className="text-sm text-neutral-light" role="status" aria-live="polite">
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
        </p>
      )}
    </div>
  );
}
