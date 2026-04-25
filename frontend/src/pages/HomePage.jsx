import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/_homePage.scss';

const HomePage = () => {

    const categories = [
        { name: 'Rings', image: '/img/rings.jpg', label: 'RINGS' },
        { name: 'Necklaces', image: '/img/necklaces.jpg', label: 'NECKLACES' },
        { name: 'Earrings', image: '/img/earrings.jpg', label: 'EARRINGS' },
        { name: 'Bracelets', image: '/img/bracelets.jpg', label: 'BRACELETS' },
    ];
    
    return (
        <div className="home-page">
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Aura Jewellery</h1>
                    <p className="hero-tagline">Timeless elegance, handcrafted for you.</p>
                    <Link 
                        to="/products" 
                        className="btn-shop-now"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        SHOP NOW
                    </Link>
                </div>
            </section>

            <section className="promo-strip">
                <span>
                    Get -20% off your entire order with code: 
                    <span className="discount-code">AURA20</span>
                </span>
            </section>

            <section className="shop-by-category">
                <h2>Shop By Category</h2>
                <div className="category-grid">
                    {categories.map((cat, index) => (
                        <Link 
                            key={index} 
                            // link to filtered products by category
                            to={`/products?categories=${cat.name}`} 
                            className="category-card"
                            style={{ backgroundImage: `url(${cat.image})` }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <span className="category-label">{cat.label}</span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="handcrafted-statement">
                <div className="statement-overlay">
                    <h2>Sustainably Handcrafted</h2>
                    <p>
                        Aura's brand leverages the natural beauty of the shapes and forms that surround us.
                    </p>
                </div>
            </section>

        </div>
    );
};

export default HomePage;
