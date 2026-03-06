"use client";

interface EmptyOrderStateProps {
  onBrowseMenu: () => void;
}

export default function EmptyOrderState({ onBrowseMenu }: EmptyOrderStateProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 p-8">
      <div className="text-center max-w-sm">
        {/* Icon */}
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-5xl">{"\u{1F6D2}"}</span>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Your order is empty</h2>
        <p className="text-gray-500 text-sm mb-6">
          Browse our menu or speak to Casey to start ordering
        </p>

        {/* Browse button */}
        <button
          onClick={onBrowseMenu}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-mcdonalds-red text-white font-semibold rounded-lg hover:bg-[#C41E3A] active:scale-95 transition-all shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Browse Menu
        </button>

        {/* Tips */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Tips</h3>
          <ul className="space-y-1.5 text-left">
            <li className="text-xs text-gray-600 flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">{"\u{1F447}"}</span>
              Tap on any menu item to add it
            </li>
            <li className="text-xs text-gray-600 flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">{"\u{2699}\uFE0F"}</span>
              Use Customize for special requests
            </li>
            <li className="text-xs text-gray-600 flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">{"\u{1F3A4}"}</span>
              Speak to Casey to order by voice
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
