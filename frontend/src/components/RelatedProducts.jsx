import React from 'react';
import ProductCard from './ProductCard';
import { useAppContext } from '../context/AppContext';
import { getRelatedProducts } from '../utils/productUtils';

/*
  component for the "related products" section on the product page
  uses a correlation algorithm to suggest similar items
*/

const RelatedProducts = ({ currentProduct }) => {
  // get all products from global context to compare with current product
  const { products } = useAppContext();
  
  // compute related products using a scoring algorithm (category + tags)
  // limit the list to top 4 matches
  const related = getRelatedProducts(currentProduct, products);
  
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
