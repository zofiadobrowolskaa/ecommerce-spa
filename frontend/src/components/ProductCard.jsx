import React from 'react';
import { Link } from 'react-router-dom';

/*
  simplified product card matching relational database structure
*/

const ProductCard = ({ product }) => {
    if (!product) return null;

    // determine price from DB, forcing number type
    const price = Number(product.price) || 0;
    
    // fallback image if specific variants are gone
    const imageUrl = product.image_url || '/img/placeholder.jpg';

    return (
        // added '/base' as a dummy variant ID so React Router matches /products/:id/:variantId
        <Link 
            to={`/products/${product.id}/base`} 
            className="product-card"
        >
            <div className="card-image-container">
                <img src={imageUrl} alt={product.name} />
            </div>

            <div className="card-info">
                <h3 className="name">{product.name}</h3>
                <p className="price">${price.toFixed(2)}</p>
                <div className="rating">{'⭐'.repeat(Math.round(product.rating || 5))}</div>
            </div>
        </Link>
    );
};

export default React.memo(ProductCard);