import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import RelatedProducts from '../components/RelatedProducts';
import toast from 'react-hot-toast';
import '../styles/pages/_productDetailsPage.scss';

const ProductDetailsPage = () => {
  const { id, variantId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useAppContext(); // only keep addToCart from context

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedVariantId, setSelectedVariantId] = useState(variantId);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);

  // fetch single product details from api gateway
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/products/${id}`);
        
        if (!response.ok) {
           if(response.status === 404) throw new Error("product not found");
           throw new Error("Failed to fetch product details");
        }
        
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
       fetchProductDetails();
    }
  }, [id]);

  // sync URL variantId with state once product is loaded
  useEffect(() => {
    if (product && product.variants) {
      if (variantId) {
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
      } else if (product.variants.length > 0) {
         // if no variant in url, default to first
         const defaultVariantId = product.variants[0].id;
         navigate(`/products/${product.id}/${defaultVariantId}`, { replace: true });
      }
    }
    // scroll to top smoothly whenever product or variant changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, variantId, product, navigate]);

  if (loading) return <div className="product-details-page">Loading details...</div>;
  if (error) {
    return (
      <div className="product-details-404">
        <h1>{error}</h1>
        <button onClick={() => navigate('/products')}>Go back to products page</button>
      </div>
    );
  }
  if (!product) return null;

  // find the currently selected variant object
  const currentVariant = product.variants?.find(v => v.id === selectedVariantId);

  // calculate final price including variant adjustment
  // ensure we handle numerical values correctly, API might return strings for decimal types
  const basePrice = Number(product.price) || 0; 
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
            src={currentVariant?.imageUrl || product.gallery?.[0] || '/img/placeholder.jpg'} 
            alt={product.name} 
            className="main-image"
          />
        </div>

        <div className="product-details-content">
          <h1>{product.name}</h1>
          <p className="price">${finalPrice.toFixed(2)}</p>
          <p className="description">{product.description}</p>

          {product.variants && product.variants.length > 0 && (
            <div className="options-group">
              <label>variant ({currentVariant?.color}):</label>
              <div className="variant-selector">
                {product.variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantChange(variant.id)}
                    className={selectedVariantId === variant.id ? 'Active' : ''}
                  >
                    {variant.color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentVariant?.size && currentVariant.size.length > 0 && (
            <div className="options-group">
              <label>size:</label>
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

      {product.aboutMaterials && Object.keys(product.aboutMaterials).length > 0 && (
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