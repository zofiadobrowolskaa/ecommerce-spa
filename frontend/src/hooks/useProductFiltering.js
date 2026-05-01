import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/*
  custom hook for product filtering synced with URL.
  updated to reflect flat relational data structure.
*/

const useProductFiltering = (products) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // compute max price directly from base product prices
  const maxInitialPrice = useMemo(() => {
    if (!products || products.length === 0) return 500;
    const allPrices = products.map(p => Number(p.price) || 0);
    return Math.ceil(Math.max(...allPrices));
  }, [products]);

  // decode filters from URL
  const filters = useMemo(() => {
    return {
      categories: searchParams.get('categories') ? searchParams.get('categories').split(',') : [],
      minPrice: Number(searchParams.get('minPrice')) || 0,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : maxInitialPrice,
      rating: Number(searchParams.get('rating')) || 0,
      searchQuery: searchParams.get('search') || '',
    };
  }, [searchParams, maxInitialPrice]);

  // update URL params
  const setFilters = useCallback((newFiltersOrFn) => {
    setSearchParams(prevParams => {
      const currentFilters = {
        categories: prevParams.get('categories') ? prevParams.get('categories').split(',') : [],
        minPrice: Number(prevParams.get('minPrice')) || 0,
        maxPrice: prevParams.get('maxPrice') ? Number(prevParams.get('maxPrice')) : maxInitialPrice,
        rating: Number(prevParams.get('rating')) || 0,
        searchQuery: prevParams.get('search') || '',
      };

      const newFilters = typeof newFiltersOrFn === 'function' 
        ? newFiltersOrFn(currentFilters) 
        : newFiltersOrFn;

      const newParams = new URLSearchParams();

      if (newFilters.categories && newFilters.categories.length > 0) {
        newParams.set('categories', newFilters.categories.join(','));
      }
      if (newFilters.searchQuery) {
        newParams.set('search', newFilters.searchQuery);
      }
      if (newFilters.minPrice > 0) {
        newParams.set('minPrice', newFilters.minPrice.toString());
      }
      if (newFilters.maxPrice < maxInitialPrice) {
        newParams.set('maxPrice', newFilters.maxPrice.toString());
      }
      // Assuming rating defaults to 0
      if (newFilters.rating > 0) {
        newParams.set('rating', newFilters.rating.toString());
      }

      return newParams;
    });
  }, [setSearchParams, maxInitialPrice]);

  // filter products based on flat properties
  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    return products.filter(product => {
      const price = Number(product.price) || 0;
      
      // Check price range
      if (price < filters.minPrice || price > filters.maxPrice) return false;

      // Note: your new DB uses 'category_id', but frontend filters use 'categories' strings. 
      // We will skip strict category filtering for now until we map IDs to Names
      // if (filters.categories.length > 0 && !filters.categories.includes(product.category_id)) return false;

      // Check search query against name
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = product.name?.toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      return true;
    });
  }, [products, filters]);

  return { 
    filters, 
    setFilters, 
    filteredProducts 
  };
};

export default useProductFiltering;