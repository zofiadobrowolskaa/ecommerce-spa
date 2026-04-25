import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/*
  custom hook for product filtering synced with URL.
  uses search params instead of local state.
*/

const useProductFiltering = (products) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // compute max price from all product variants
  const maxInitialPrice = useMemo(() => {
    if (!products || products.length === 0) return 500;
    const allPossiblePrices = products.flatMap(product => 
      product.variants.map(variant => product.price + variant.priceAdjustment)
    );
    return Math.ceil(Math.max(...allPossiblePrices));
  }, [products]);

  // decode filters from URL, use defaults if missing
  const filters = useMemo(() => {
    return {
      categories: searchParams.get('categories') ? searchParams.get('categories').split(',') : [],
      minPrice: Number(searchParams.get('minPrice')) || 0,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : maxInitialPrice,
      rating: Number(searchParams.get('rating')) || 0,
      searchQuery: searchParams.get('search') || '',
    };
  }, [searchParams, maxInitialPrice]);

  // update URL params instead of local state
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

      if (newFilters.rating > 0) {
        newParams.set('rating', newFilters.rating.toString());
      }

      return newParams;
    });
  }, [setSearchParams, maxInitialPrice]);

  // filter products based on decoded filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const variantPrices = product.variants.map(v => product.price + v.priceAdjustment);
      const hasMatchInRange = variantPrices.some(price => 
        price >= filters.minPrice && price <= filters.maxPrice
      );
      if (!hasMatchInRange) return false;

      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
        return false;
      }

      if (product.rating < filters.rating) return false;

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesTag = product.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesName && !matchesTag) return false;
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
