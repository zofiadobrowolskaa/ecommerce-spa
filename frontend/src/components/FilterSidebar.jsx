import React, { useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

/*
  filter sidebar for live product filtering
  updates filters state instead of filtering data directly
  uses useMemo and useCallback for performance
*/
const CATEGORIES = ["Rings", "Earrings", "Necklaces", "Bracelets"];

const FilterSidebar = ({ filters, setFilters }) => {
  const { products } = useAppContext();

  // generic handler for text/number inputs
  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    
    setFilters(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  }, [setFilters]);

  // toggle category selection
  const handleCategoryToggle = useCallback((category) => {
    setFilters(prev => {
      const categories = prev.categories || [];
      const newCategories = categories.includes(category)
        ? categories.filter(c => c !== category)
        : [...categories, category];
      return { ...prev, categories: newCategories };
    });
  }, [setFilters]);

  // validate price range to prevent min > max
  const handlePriceChange = useCallback((e) => {
    const { name, value } = e.target;
    const numValue = Number(value);
    
    if (name === 'minPrice' && numValue > filters.maxPrice) return;
    if (name === 'maxPrice' && numValue < filters.minPrice) return;
    
    setFilters(prev => ({ ...prev, [name]: numValue }));
  }, [filters, setFilters]);

  // calculate maximum available price from all variants
  const maxAvailablePrice = useMemo(() => {
    if (products.length === 0) return 500;

    const allPrices = products.flatMap(p => 
      p.variants.map(v => p.price + v.priceAdjustment)
    );
    
    return Math.ceil(Math.max(...allPrices, 500));
  }, [products]);

  const selectedCategories = filters.categories || [];

  return (
    <aside className="filter-sidebar">
      <h2>Filters</h2>
      
      <div className="filter-group">
        <label htmlFor="searchQuery">Search (Name/Tag)</label>
        <input 
          id="searchQuery"
          name="searchQuery" 
          type="text" 
          value={filters.searchQuery} 
          onChange={handleChange}
          placeholder="eg. gold, heart, diamond"
        />
      </div>

      <div className="filter-group">
        <label>Categories</label>
        <div className="categories-list">
          {CATEGORIES.map(category => (
            <label key={category} className="category-checkbox">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
        {selectedCategories.length > 0 && (
          <button
            className="clear-categories-btn"
            onClick={() => setFilters(prev => ({ ...prev, categories: [] }))}
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="filter-group">
        <label>Price Range: ${filters.minPrice} - ${filters.maxPrice}</label>
        
        <input 
          type="range" 
          name="minPrice" 
          min="0" 
          max={maxAvailablePrice} 
          value={filters.minPrice} 
          onChange={handlePriceChange} 
        />
        
        <input 
          type="range" 
          name="maxPrice" 
          min="0" 
          max={maxAvailablePrice} 
          value={filters.maxPrice} 
          onChange={handlePriceChange} 
        />
      </div>

      <div className="filter-group">
        <label htmlFor="rating">Min. Rating ({filters.rating}⭐)</label>
        <input 
          id="rating"
          name="rating" 
          type="range" 
          min="0" 
          max="5" 
          step="0.5"
          value={filters.rating}
          onChange={handleChange}
        />
      </div>
    </aside>
  );
};

export default FilterSidebar;
