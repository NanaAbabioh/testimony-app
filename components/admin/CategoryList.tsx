interface CategoryItem {
  name: string;
  count: number;
}

interface CategoryListProps {
  items: CategoryItem[];
  total?: number;
}

export default function CategoryList({ items, total }: CategoryListProps) {
  const maxCount = total || Math.max(...items.map(item => item.count));

  return (
    <div className="rounded-[18px] bg-[hsl(var(--bg-snow))] dark:bg-gray-800 shadow-[var(--shadow)] border border-black/5 dark:border-white/10 p-6">
      <h2 className="font-serif text-lg font-semibold text-[#101030] dark:text-white mb-6">
        Category breakdown
      </h2>
      
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">📂</div>
          <p>No categories found yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, index) => {
            
            return (
              <div 
                key={item.name} 
                className="bg-white dark:bg-gray-900 rounded-[12px] border border-black/5 dark:border-white/10 p-4 hover:shadow-md transition-shadow flex flex-col justify-between min-h-[100px]"
              >
                <div className="text-sm font-medium text-[#101030] dark:text-white mb-3 leading-tight break-words hyphens-auto" style={{ minHeight: '2.5rem' }}>
                  {item.name}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-[#5050F0] dark:text-[#7070FF]">
                    {item.count}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    testimonies
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}