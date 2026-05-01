// frontend/src/context/AppContext.jsx
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useLocalStorage from '../hooks/useLocalStorage';
import { authService } from '../auth/authService';

export const AppContext = createContext();

// helper to calculate total value of items in the cart
const calculateCartTotal = (currentCart, products) => {
  return currentCart.reduce((total, item) => {
    // safely match string or number IDs using ==
    const product = products.find(p => p.id == item.productId);
    if (!product) return total;
    
    // safe check for variants using optional chaining
    const variant = product.variants?.find(v => v.id === item.variantId);
    
    // force numerical types to prevent string concatenation bugs
    const basePrice = Number(product.price) || 0;
    const adjustment = variant ? Number(variant.priceAdjustment) : 0;
    
    return total + ((basePrice + adjustment) * item.quantity);
  }, 0);
};

const defaultProfile = {
    name: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    house_number: '',
    flat_number: '',
    postalCode: '',
    city: '',
    country: '',
};

export const AppProvider = ({ children }) => {
  // state for products fetched from the backend (replaces local storage)
  const [products, setProducts] = useState([]);
  
  // server-side cart state replacing local storage
  const [cart, setCart] = useState([]);
  
  const [userRole, setUserRole] = useLocalStorage('userRole', 'client'); 
  const [discount, setDiscount] = useLocalStorage('discount', { code: '', percentage: 0 });
  const [orders, setOrders] = useLocalStorage('orders', [])
  const [user, setUser] = useState(null);
  const [profile, setProfileState] = useState(defaultProfile);

  // fetch products globally on mount to populate context for cart calculations
  useEffect(() => {
    const fetchGlobalProducts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/products');
        setProducts(response.data);
      } catch (error) {
        console.error('failed to fetch products for context', error);
      }
    };
    fetchGlobalProducts();
  }, []);

  // initialize authentication state
  useEffect(() => {
    const initAuth = () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setProfileState({
            name: currentUser.name || '',
            surname: currentUser.surname || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '',
            address: currentUser.address || '',
            house_number: currentUser.house_number || '',
            flat_number: currentUser.flat_number || '',
            postalCode: currentUser.postalCode || '',
            city: currentUser.city || '',
            country: currentUser.country || '',
        });
      }
    };
    initAuth();
  }, []);

  const isAdmin = userRole === 'admin';
  const loginAs = (role) => {
    if (role === 'admin' || role === 'client') {
        setUserRole(role);
    }
  };

  const cartTotal = useMemo(() => calculateCartTotal(cart, products), [cart, products]);
  const discountValue = useMemo(() => cartTotal * discount.percentage, [cartTotal, discount]);

  // sync function to push cart state to api gateway
  const syncCartWithServer = useCallback(async (newCart) => {
    setCart(newCart);
    try {
      // transform frontend cart format into backend payload
      const items = newCart.map(item => {
        const product = products.find(p => p.id == item.productId);
        const variant = product?.variants?.find(v => v.id === item.variantId);
        
        // safely extract numeric prices
        const price = (Number(product?.price) || 0) + (Number(variant?.priceAdjustment) || 0);
        
        return { productId: item.productId, quantity: item.quantity, price };
      });
      
      const userId = user?.email || 'u1'; // fallback to u1 for testing
      await axios.post(`http://localhost:3000/api/cart/${userId}/sync`, { items });
    } catch (error) {
      console.error('failed to sync cart with server', error);
    }
  }, [products, user]);

  // modified cart functions to trigger server sync
  const addToCart = useCallback((productId, variantId, quantity = 1, size = null) => {
    const idx = cart.findIndex(item => item.productId === productId && item.variantId === variantId && item.size === size);
    let newCart;
    if (idx > -1) {
      newCart = [...cart];
      newCart[idx].quantity += quantity;
    } else {
      newCart = [...cart, { productId, variantId, quantity, size }];
    }
    syncCartWithServer(newCart);
  }, [cart, syncCartWithServer]);

  const removeFromCart = useCallback((productId, variantId, size = null) => {
    const newCart = cart.filter(item => !(item.productId === productId && item.variantId === variantId && item.size === size));
    syncCartWithServer(newCart);
  }, [cart, syncCartWithServer]);

  const updateQuantity = useCallback((productId, variantId, newQuantity, size = null) => {
    if (newQuantity <= 0) return removeFromCart(productId, variantId, size);
    const newCart = cart.map(item => (item.productId === productId && item.variantId === variantId && item.size === size) ? { ...item, quantity: newQuantity } : item);
    syncCartWithServer(newCart);
  }, [cart, removeFromCart, syncCartWithServer]);

  const applyDiscount = useCallback((code) => {
    if (code === 'AURA20') {
        setDiscount({ code: 'AURA20', percentage: 0.20 });
        return true;
    }
    return false;
  }, [setDiscount]);
  
  const resetDiscount = useCallback(() => setDiscount({ code: '', percentage: 0 }), [setDiscount]);

  // place order clears the cart and pushes empty state to server
  const placeOrder = useCallback((orderData) => {
    const newOrder = {
      id: `ORD-${Date.now()}`,
      date: new Date().toISOString(),
      items: cart,
      total: cartTotal - discountValue,
      details: orderData,
      status: 'Completed',
    };
    setOrders(prev => [newOrder, ...prev]);
    syncCartWithServer([]); // clear server cart
    resetDiscount();
    return newOrder.id;
  }, [cart, cartTotal, discountValue, setOrders, syncCartWithServer, resetDiscount]);

  const removeOrder = useCallback((id) => setOrders(prev => prev.filter(o => o.id !== id)), [setOrders]);

  const login = useCallback(async (email, password) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const userData = authService.login(email, password);
      setUser(userData);
      
      setProfileState({
          ...defaultProfile,
          ...userData
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  const register = useCallback(async (email, password, name, surname) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const userData = authService.register(email, password, name, surname);
      setUser(userData);
      
      setProfileState({
          ...defaultProfile,
          name: userData.name,
          surname: userData.surname,
          email: userData.email
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setProfileState(defaultProfile);
    syncCartWithServer([]); // clear server cart on logout
    setDiscount({ code: '', percentage: 0 });
  }, [syncCartWithServer, setDiscount]);

  const updateProfile = useCallback((updatedData) => {
    try {
        setProfileState(prev => ({ ...prev, ...updatedData }));
        
        if (user) {
           const updatedUser = authService.updateUser(updatedData);
           setUser(updatedUser);
        }
    } catch (error) {
      // profile update failed
    }
  }, [user]);

  const addProduct = useCallback((newProduct) => setProducts(prev => [newProduct, ...prev]), [setProducts]);
  const updateProduct = useCallback((updatedProduct) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)), [setProducts]);
  const deleteProduct = useCallback((id) => setProducts(prev => prev.filter(p => p.id !== id)), [setProducts]);

  const resetAppData = useCallback(() => {
    localStorage.removeItem('products');
    localStorage.removeItem('orders');
    localStorage.removeItem('discount');
    syncCartWithServer([]); // clear server cart

    window.location.reload();
  }, [syncCartWithServer]);

  const contextValue = {
    products, setProducts,
    cart, addToCart, removeFromCart, updateQuantity, cartTotal,
    discount, applyDiscount, discountValue, cartTotalAfterDiscount: cartTotal - discountValue,
    userRole, loginAs, isAdmin,
    orders, placeOrder, removeOrder,
    login, logout, register, user,
    profile, updateProfile,
    addProduct, updateProduct, deleteProduct,
    resetAppData,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}