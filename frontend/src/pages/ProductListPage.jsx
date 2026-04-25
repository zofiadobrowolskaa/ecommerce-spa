import React, { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import useProductFiltering from '../hooks/useProductFiltering';
import usePagination from '../hooks/usePagination';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import Pagination from '../components/Pagination';
import '../styles/pages/_productListPage.scss';

const ProductListPage = () => {
  const { products } = useAppContext();
  const { filters, setFilters, filteredProducts } = useProductFiltering(products);
  const [searchParams, setSearchParams] = useSearchParams();

  // pagination configuration
  const pagination = usePagination(filteredProducts, 12, { paramName: 'page' });

  // sync category filter with URL
  useEffect(() => {
    const categoryFromUrl = searchParams.get('categories');
    if (categoryFromUrl) {
      setFilters(prev => ({ ...prev, categories: categoryFromUrl.split(',') }));
    }
  }, [searchParams, setFilters]);

  // reset page to 1 when filters change
  useEffect(() => {
    if (pagination.currentPage > 1) {
        pagination.goToPage(1);
    }
  }, [filters]); 

  const handleCategoriesChange = useCallback((newCategories) => {
    // update URL params for categories and reset page to 1
    setSearchParams(prev => {
        if (!newCategories || newCategories.length === 0) {
            prev.delete('categories');
        } else {
            prev.set('categories', newCategories.join(','));
        }
        prev.set('page', '1'); 
        return prev;
    });
  }, [setSearchParams]);

  return (
    <div className="product-list-page">
      <h1 className="page-title">Jewellery</h1>
      
      <div className="content-wrapper">
        <FilterSidebar 
          filters={filters} 
          setFilters={(newFilters) => {
             if (typeof newFilters === 'function') {
                const next = newFilters(filters);
                handleCategoriesChange(next.categories);
             } else {
                handleCategoriesChange(newFilters.categories);
             }
             setFilters(newFilters);
          }} 
        /> 
        
        <div className="products-section">
          <div className="product-grid">
            {pagination.paginatedItems.length === 0 ? (
              <p className="no-results">No products found matching your criteria.</p>
            ) : (
              pagination.paginatedItems.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
          
          {/* show pagination only if more than 1 page */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
              itemsPerPage={pagination.itemsPerPage}
              totalItems={pagination.totalItems}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
