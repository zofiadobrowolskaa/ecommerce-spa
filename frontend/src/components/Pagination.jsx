import React from 'react';
import '../styles/components/_pagination.scss';

/*
  pagination component for navigating pages
  shows limited number of page buttons with ellipsis
*/

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage,
  totalItems 
}) => {
  if (totalPages <= 1) return null;

  // navigate to a specific page within bounds
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };


  const pages = [];
  const maxPagesToShow = 5; 
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  // render individual page button
  const renderPageButton = (pageNumber) => (
    <button
      key={pageNumber}
      onClick={() => handlePageChange(pageNumber)}
      className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
      aria-label={`Go to page ${pageNumber}`}
      aria-current={currentPage === pageNumber ? 'page' : undefined}
    >
      {pageNumber}
    </button>
  );

  // add first page and starting ellipsis
  if (startPage > 1) {
    pages.push(renderPageButton(1));
    if (startPage > 2) {
      pages.push(<span key="dots-start" className="pagination-dots">...</span>);
    }
  }

  // add main range of page buttons
  for (let i = startPage; i <= endPage; i++) {
    pages.push(renderPageButton(i));
  }

  // add ending ellipsis and last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(<span key="dots-end" className="pagination-dots">...</span>);
    }
    pages.push(renderPageButton(totalPages));
  }

  return (
    <div className="pagination-wrapper">
      <div className="pagination-container">

        <button
          onClick={() => handlePageChange(currentPage - 1)}
          className="pagination-arrow"
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          &lt;
        </button>

        <div className="pagination-numbers">
          {pages}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          className="pagination-arrow"
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default Pagination;
