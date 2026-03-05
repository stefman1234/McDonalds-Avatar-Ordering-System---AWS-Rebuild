'use client';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: 'all', name: 'All Items', icon: '🍽️' },
  { id: 'burgers', name: 'Burgers', icon: '🍔' },
  { id: 'chicken', name: 'Chicken', icon: '🍗' },
  { id: 'breakfast', name: 'Breakfast', icon: '🥞' },
  { id: 'sides', name: 'Sides', icon: '🍟' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
  { id: 'desserts', name: 'Desserts', icon: '🍦' },
  { id: 'happy_meal', name: 'Happy Meal', icon: '🎁' },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
                  font-medium text-sm transition-all duration-200
                  ${
                    isActive
                      ? 'bg-mcd-red text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { CATEGORIES };
