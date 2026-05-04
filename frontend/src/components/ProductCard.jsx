import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/*
  product card for multi-variant products
  uses react.memo to avoid unnecessary re-renders
*/

const ProductCard = ({ product }) => {
    if (!product) return null;

    // extract variants (if available)
    const variants = product.variants || [];
    const defaultVariant = variants[0] || null;

    // track currently hovered variant
    const [hoverVariantId, setHoverVariantId] = useState(defaultVariant?.id);
    const activeVariant = variants.find(v => v.id === hoverVariantId) || defaultVariant;

    // calculate final price (base + variant adjustment)
    const basePrice = Number(product.price) || 0;
    const finalPrice = basePrice + (Number(activeVariant?.priceAdjustment) || 0);
    
    // select image: variant > gallery > fallback
    const imageUrl =
        activeVariant?.imageUrl ||
        product.gallery?.[0] ||
        product.image_url ||
        '/img/placeholder.jpg';

    // use SKU for routing if available (stable public identifier)
    // allows SEO-friendly and stable URLs instead of numeric DB IDs
    const productIdForLink = product.sku || product.id;

    // fallback variant id for routing
    const finalVariantId = activeVariant?.id || 'base';

    // reset to default variant when leaving card
    const handleMouseLeave = () => {
        if (defaultVariant) setHoverVariantId(defaultVariant.id);
    };

    return (
        <Link 
            to={`/products/${productIdForLink}/${finalVariantId}`} 
            className="product-card"
            onMouseLeave={handleMouseLeave}
        >
            <div className="card-image-container">
                <img src={imageUrl} alt={product.name} />
            </div>

            <div className="card-info">
                <h3 className="name">{product.name}</h3>
                <p className="price">${finalPrice.toFixed(2)}</p>

                {/* rating display (unchanged logic) */}
                <div className="rating">{'⭐'.repeat(Math.round(product.rating || 5))}</div>

                {/* render variant swatches if multiple variants exist */}
                {variants.length > 1 && (
                    <div className="variant-swatches">
                        {variants.map(variant => (
                            <div 
                                key={variant.id}
                                onMouseEnter={() => setHoverVariantId(variant.id)}
                                className={`swatch ${variant.id === activeVariant?.id ? 'active' : ''}`}
                                title={variant.color} 
                            ></div>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
};

export default React.memo(ProductCard);