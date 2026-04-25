import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/*
  product card for multi-variant products
  uses react.memo to avoid unnecessary re-renders
*/

const ProductCard = ({ product }) => {
    // skip rendering if no variants
    if (!product?.variants?.length) {
        return null;
    }

    const variants = product.variants;
    const defaultVariant = variants[0];

    // local state to track hovered variant
    const [hoverVariantId, setHoverVariantId] = useState(defaultVariant.id);

    // determine active variant based on hover
    const activeVariant = variants.find(v => v.id === hoverVariantId) || defaultVariant;

    // calculate price dynamically
    const finalPrice = product.price + activeVariant.priceAdjustment;
    const finalImageUrl = activeVariant.imageUrl;
    const finalVariantId = activeVariant.id;

    // reset hover to default variant
    const handleMouseLeave = () => {
        setHoverVariantId(defaultVariant.id);
    };

    return (
        // dynamic routing using product and variant IDs
        <Link 
            to={`/products/${product.id}/${finalVariantId}`} 
            className="product-card"
            onMouseLeave={handleMouseLeave}
        >
            <div className="card-image-container">
                {/* update image based on active variant */}
                <img src={finalImageUrl} alt={`${product.name} - ${activeVariant.color}`} />
            </div>

            <div className="card-info">
                <h3 className="name">{product.name}</h3>
                <p className="price">${finalPrice.toFixed(2)}</p>
                <div className="rating">{'⭐'.repeat(Math.round(product.rating))}</div>

                {/* render variant swatches if multiple variants exist */}
                {variants.length > 1 && (
                    <div className="variant-swatches">
                        {variants.map(variant => (
                            <div 
                                key={variant.id}
                                onMouseEnter={() => setHoverVariantId(variant.id)}
                                className={`swatch ${variant.id === activeVariant.id ? 'active' : ''}`}
                                title={variant.color} 
                            >
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
};

// memoize for performance optimization
export default React.memo(ProductCard);
