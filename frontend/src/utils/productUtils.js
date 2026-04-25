/**
  find related products for the currently viewed product based on category and tags

  @param {object} currentProduct
  @param {array} allProducts - all products from AppContext
  @returns {array} - top 4 most relevant suggestions, sorted by score
*/
export const getRelatedProducts = (currentProduct, allProducts) => {
  const related = allProducts

    // exclude the current product
    .filter(p => p.id !== currentProduct.id)

    // calculate a relevance score for each product
    .map(product => {
      const commonTags = product.tags.filter(tag => currentProduct.tags.includes(tag)).length;
      const categoryMatch = product.category === currentProduct.category ? 1 : 0;
      const score = commonTags + categoryMatch;

      // return a temporary object with product and its score
      return { product, score };
    })

    // remove products with no matching tags or category
    .filter(item => item.score > 0) 

    // sort products from highest to lowest score
    .sort((a, b) => b.score - a.score) 

    // take top 4 matches
    .slice(0, 4); 

  // extract only the product objects for rendering in <ProductCard />
  return related.map(item => item.product);
};
