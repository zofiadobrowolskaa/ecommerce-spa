import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';

const CartIcon = () => {
  const { cart } = useAppContext();
  
  const itemCount = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0), 
    [cart]
  ); 

  return (
    <Link to="/cart" className="cart-icon">
      Cart ({itemCount})
    </Link>
  );
};

export default CartIcon;