import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import { confirmDialog } from '../components/ConfirmDialog'; 
import '../styles/pages/_cartPage.scss';

/*
  aggregate cart state by merging lightweight cart items with full product data
  simplified for flat relational DB schema (no variants)
*/

const CartPage = () => {
  const { 
    cart, 
    products, 
    cartTotal, 
    updateQuantity, 
    removeFromCart, 
    applyDiscount, 
    discountValue, 
    discount 
  } = useAppContext();

  // state for promo code input
  const [promoCode, setPromoCode] = useState('');

  // apply promo code using context function, show feedback toast
  const handleApplyPromo = () => {
    const success = applyDiscount(promoCode);
    if (success) {
      toast.success('Discount code applied successfully!');
      setPromoCode('');
    } else {
      toast.error('Invalid discount code.');
    }
  };

  // remove a cart item by productId, variantId, and size
  const handleRemove = async (item) => {
    const sizeText = item.itemSize ? ` (Size: ${item.itemSize})` : '';
    
    const confirmed = await confirmDialog.show(
      'Remove from Cart',
      `Are you sure you want to remove "${item.productName}"${sizeText} from your cart?`
    );

    if (confirmed) {
      removeFromCart(item.productId, item.variantId, item.itemSize);
      toast.success(`${item.productName}${sizeText} removed from cart.`);
    }
  };

  // determine if discount is applied and calculate final total
  const isDiscountApplied = discount.percentage > 0;
  const finalTotal = cartTotal - discountValue;

  // merge cart items with full product info (no variants yet)
  const cartItemsData = cart.map(item => {
    // safely match numeric/string IDs
    const product = products.find(p => p.id == item.productId);

    if (!product) return null;

    // ensure numerical operations
    const unitPrice = Number(product.price) || 0;

    return {
      ...item,
      productName: product.name,
      variantColor: 'Default', // fallback for now
      itemSize: item.size,
      imageUrl: product.image_url || '/img/placeholder.jpg',
      unitPrice,
      totalPrice: unitPrice * item.quantity,
    };
  }).filter(item => item !== null); // remove null entries

  if (cartItemsData.length === 0) {
    return (
      <div className="cart-page empty-cart">
        <h1>Your cart is empty</h1>
        <p>Return to the catalog to find the perfect jewellery.</p>
        <Link to="/products" className="go-to-catalog">Go to catalog</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Your cart ({cartItemsData.length} items)</h1>
      
      <div className="cart-content-wrapper">

        <div className="cart-items">
          {cartItemsData.map(item => (
            <div key={`${item.productId}-${item.variantId}-${item.itemSize}`} className="cart-item">
              <Link to={`/products/${item.productId}/base`}>
                <img src={item.imageUrl} alt={item.productName} className="item-image" />
              </Link>
              <div className="item-details">
                <h3>
                  <Link to={`/products/${item.productId}/base`} className="item-name-link">
                    {item.productName} 
                  </Link>
                  {item.itemSize && <span> - Size: {item.itemSize}</span>}
                </h3>
                <p>Unit price: ${item.unitPrice.toFixed(2)}</p>
                <div className="item-controls">
                  <label>Quantity:</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={item.quantity} 
                    onChange={(e) => updateQuantity(item.productId, item.variantId, Number(e.target.value), item.itemSize)}
                    className="quantity-input"
                  />
                  <button onClick={() => handleRemove(item)} className="btn-remove">
                    Remove
                  </button>
                </div>
              </div>
              <div className="item-subtotal">
                ${item.totalPrice.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        
        {/* render cart summary, subtotal, discount, and checkout button */}
        <div className="cart-summary">
          <h2>Summary</h2>
          
          <div className="summary-line">
            <span>Subtotal:</span>
            <span>${(Number(cartTotal) || 0).toFixed(2)}</span>
          </div>

          {/* promo code form, prevent page reload, disable after discount */}
          <form 
            className="promo-section" 
            onSubmit={(e) => {
              e.preventDefault();
              handleApplyPromo();
            }}
          >
            <input 
              type="text" 
              placeholder="Promo code" 
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={isDiscountApplied}
            />
            <button type="submit" disabled={isDiscountApplied}>
              Apply
            </button>
            {isDiscountApplied && (<p className="promo-success">Discount applied! (-20%)</p>)}
          </form>

          {/* show discount line if applied */}
          {isDiscountApplied && (
            <div className="summary-line discount-line">
              <span>Discount (AURA20):</span>
              <span>-${(Number(discountValue) || 0).toFixed(2)}</span>
            </div>
          )}

          <div className="summary-line total-line">
            <span>Total:</span>
            <span>${(Number(finalTotal) || 0).toFixed(2)}</span>
          </div>

          <Link 
            to="/checkout" 
            className="btn-checkout"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;