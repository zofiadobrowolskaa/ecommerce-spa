import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import RelatedProducts from '../components/RelatedProducts';
import toast from 'react-hot-toast';
import '../styles/pages/_productDetailsPage.scss';

const ProductDetailsPage = () => {
  const { id, variantId } = useParams();
  const navigate = useNavigate();
  const { products, addToCart } = useAppContext();

  // find the product by id from the global product list
  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="product-details-404">
        <h1>Product not found</h1>
        <button onClick={() => navigate('/products')}>Go back to products page</button>
      </div>
    );
  }

  const [selectedVariantId, setSelectedVariantId] = useState(variantId);
  const [quantity, setQuantity] = useState(1);

  // find the currently selected variant object
  const currentVariant = product.variants?.find(v => v.id === selectedVariantId);

  // state for selected size, defaulting to first size of variant
  const initialSize = currentVariant?.size?.[0] || null;
  const [selectedSize, setSelectedSize] = useState(initialSize);

  // calculate final price including variant adjustment
  const basePrice = product.price || 0;
  const finalPrice = basePrice + (currentVariant?.priceAdjustment || 0);

  // update variant selection, URL, and reset quantity and size
  const handleVariantChange = (newVariantId) => {
    const newVariant = product.variants.find(v => v.id === newVariantId);
    navigate(`/products/${product.id}/${newVariantId}`);
    setSelectedVariantId(newVariantId);

    const newSize = newVariant?.size?.[0] || null;
    setSelectedSize(newSize);
    setQuantity(1);
  };

  // sync URL variantId with state, handle invalid variant IDs
  useEffect(() => {
    if (variantId && product) {
      const variantExists = product.variants.some(v => v.id === variantId);

      if (variantExists) {
        setSelectedVariantId(variantId);
        const currentVariantFromUrl = product.variants.find(v => v.id === variantId);
        setSelectedSize(currentVariantFromUrl?.size?.[0] || null);
        setQuantity(1);
      } else {
        const defaultVariantId = product.variants[0].id;
        navigate(`/products/${product.id}/${defaultVariantId}`, { replace: true });
      }
    }

    // scroll to top smoothly whenever product or variant changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, variantId, product, navigate]);

  // add selected product variant and quantity to cart with validation
  const handleAddToCart = () => {
    if (!selectedVariantId) {
      toast.error('Please select a variant before adding to cart');
      return;
    }

    const qtyNumber = Number(quantity);

    // validate quantity > 0
    if (!quantity || qtyNumber === 0) {
      toast.error('You cannot add 0 products to the cart');
      return;
    }

    // add to cart using context method
    addToCart(product.id, selectedVariantId, qtyNumber, selectedSize);

    const sizeInfo = selectedSize ? ` size: ${selectedSize}` : '';
    const variantInfo = currentVariant?.color ? ` (${currentVariant.color})` : '';
    toast.success(`Added ${qtyNumber}x ${product.name}${variantInfo}${sizeInfo} to cart!`);
  };

  return (
    <div className="product-details-page">
      <div className="product-main-info">
        <div className="product-image-gallery">
          <img 
            src={currentVariant?.imageUrl} 
            alt={product.name} 
            className="main-image"
          />
        </div>

        <div className="product-details-content">
          <h1>{product.name}</h1>
          <p className="price">${finalPrice.toFixed(2)}</p>
          <p className="description">{product.description}</p>

          <div className="options-group">
            <label>Variant ({currentVariant?.color}):</label>
            <div className="variant-selector">
              {product.variants.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantChange(variant.id)}
                  className={selectedVariantId === variant.id ? 'active' : ''}
                >
                  {variant.color}
                </button>
              ))}
            </div>
          </div>

          {currentVariant?.size && currentVariant.size.length > 0 && (
            <div className="options-group">
              <label>Size:</label>
              <select onChange={(e) => setSelectedSize(e.target.value)} value={selectedSize}>
                {currentVariant.size.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}

          <div className="options-group quantity-and-cart">
            <input 
              type="number" 
              min="0" 
              max="999"
              value={quantity} 
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setQuantity('');
                } else {
                  const numVal = Number(val);
                  if (!isNaN(numVal) && numVal >= 0) {
                    setQuantity(numVal);
                  }
                }
              }}
              onBlur={() => {
                if (quantity === '') setQuantity(1);
              }}
              className="quantity-input"
            />
            <button onClick={handleAddToCart} className="add-to-cart-btn">
              Add to cart
            </button>
          </div>
        </div>
      </div>

      {/* show related products section */}
      <RelatedProducts currentProduct={product} /> 

      {product.aboutMaterials && (
        <section className="product-materials">
          <h2>About the materials</h2>
          {Object.entries(product.aboutMaterials).map(([materialName, description]) => (
            <div key={materialName} className="material-item">
              <p><strong>{materialName}:</strong> {description}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default ProductDetailsPage;
