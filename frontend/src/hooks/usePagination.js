import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/*
  custom pagination hook synced with URL
  paramName: allows multiple independent paginations in one app
*/

const usePagination = (items, itemsPerPage = 10, options = {}) => {
  const { paramName = 'page', scrollToTop = true } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  // state for current page to trigger re-renders when page changes
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get(paramName), 10);
    return isNaN(page) || page < 1 ? 1 : page;
  });

  // keep currentPage in sync with URL changes
  useEffect(() => {
    const page = parseInt(searchParams.get(paramName), 10);
    const validPage = isNaN(page) || page < 1 ? 1 : page;
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
    }
  }, [searchParams, paramName, currentPage]);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  // self-healing: reset to page 1 if currentPage exceeds totalPages after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
      setSearchParams(prev => {
        prev.set(paramName, totalPages.toString());
        return prev;
      }, { replace: true });
    }
  }, [currentPage, totalPages, paramName, setSearchParams]);

  useEffect(() => {
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, scrollToTop]);

  // navigate to a specific page (updates state and URL)
  const goToPage = (pageNumber) => {
    const targetPage = Math.max(1, Math.min(pageNumber, totalPages || 1));

    // update state first to trigger re-render
    setCurrentPage(targetPage);

    // update URL parameter
    setSearchParams(prev => {
      prev.set(paramName, targetPage.toString());
      return prev;
    });
  };

  // slice items for the current page
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage: () => goToPage(currentPage + 1),
    prevPage: () => goToPage(currentPage - 1),
    itemsPerPage,
    totalItems: items.length,
  };
};

export default usePagination;