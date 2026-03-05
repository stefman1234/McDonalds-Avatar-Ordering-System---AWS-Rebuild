'use client';

interface FilterBannerProps {
  query: string;
  count: number;
  message?: string;
  onClear: () => void;
}

export function FilterBanner({ query, count, message, onClear }: FilterBannerProps) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4 rounded-r-lg shadow-sm">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          {message ? (
            <p className="text-sm font-medium text-gray-900 mb-1">{message}</p>
          ) : (
            <p className="text-sm font-medium text-gray-900 mb-1">
              Showing {count} item{count !== 1 ? 's' : ''} matching "{query}"
            </p>
          )}
          <p className="text-xs text-gray-600">
            {count === 0
              ? 'Try a different search term or browse all items'
              : 'Tap an item to add it to your order'}
          </p>
        </div>

        <button
          onClick={onClear}
          className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
        >
          Show All Items
        </button>
      </div>
    </div>
  );
}
