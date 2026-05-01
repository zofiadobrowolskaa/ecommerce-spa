import React from 'react';
import ProductCard from './ProductCard';
import { useAppContext } from '../context/AppContext';

/*
  component for the "related products" section on the product page
  updated to safely use relational database structure (category_id)
*/

const RelatedProducts = ({ currentProduct }) => {
  // get all products from global context
  const { products } = useAppContext();
  
  // guard against missing data
  if (!products || !Array.isArray(products) || !currentProduct) {
    return null; 
  }

  // compute related products matching the same category_id
  // exclude the current product itself and limit to 4 items
  const related = products
    .filter(p => p.category_id === currentProduct.category_id && p.id !== currentProduct.id)
    .slice(0, 4);
  
  if (related.length === 0) {
    return null; // no related products, don't render section
  }

  return (
    <section className="related-products-section">
      <h2>Related products</h2>
      
      <div className="product-grid">
        {/* render product cards using component composition pattern */}
        {related.map(product => (
          <ProductCard key={product.id} product={product} /> 
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;