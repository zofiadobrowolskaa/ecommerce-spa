import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import initialProducts from '../data/products.json';
import { authService } from '../auth/authService';

export const AppContext = createContext();

const calculateCartTotal = (currentCart, products) => {
  return currentCart.reduce((total, item) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return total;
    const variant = product.variants.find(v => v.id === item.variantId);
    if (!variant) return total;
    return total + ((product.price + variant.priceAdjustment) * item.quantity);
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

  const [products, setProducts] = useLocalStorage('products', initialProducts);
  const [cart, setCart] = useLocalStorage('cart', []);
  const [userRole, setUserRole] = useLocalStorage('userRole', 'client'); 
  const [discount, setDiscount] = useLocalStorage('discount', { code: '', percentage: 0 });
  const [orders, setOrders] = useLocalStorage('orders', [])
  const [user, setUser] = useState(null);
  const [profile, setProfileState] = useState(defaultProfile);

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

  const addToCart = useCallback((productId, variantId, quantity = 1, size = null) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.productId === productId && item.variantId === variantId && item.size === size);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += quantity;
        return copy;
      }
      return [...prev, { productId, variantId, quantity, size }];
    });
  }, [setCart]);

  const removeFromCart = useCallback((productId, variantId, size = null) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.variantId === variantId && item.size === size)));
  }, [setCart]);

  const updateQuantity = useCallback((productId, variantId, newQuantity, size = null) => {
    if (newQuantity <= 0) return removeFromCart(productId, variantId, size);
    setCart(prev => prev.map(item => (item.productId === productId && item.variantId === variantId && item.size === size) ? { ...item, quantity: newQuantity } : item));
  }, [setCart, removeFromCart]);

  const applyDiscount = useCallback((code) => {
    if (code === 'AURA20') {
        setDiscount({ code: 'AURA20', percentage: 0.20 });
        return true;
    }
    return false;
  }, [setDiscount]);
  
  const resetDiscount = useCallback(() => setDiscount({ code: '', percentage: 0 }), [setDiscount]);

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
    setCart([]);
    resetDiscount();
    return newOrder.id;
  }, [cart, cartTotal, discountValue, setOrders, setCart, resetDiscount]);

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
    setCart([]);
    setDiscount({ code: '', percentage: 0 });
  }, [setCart, setDiscount]);

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
    localStorage.removeItem('cart');
    localStorage.removeItem('discount');

    window.location.reload();
  }, []);

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

// custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}