import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

import Step1Details from '../components/checkout/Step1_Details'; 
import Step2Shipping from '../components/checkout/Step2_Shipping';
import Step3Payment from '../components/checkout/Step3_Payment';
import Step4Summary from '../components/checkout/Step4_Summary';
import '../styles/pages/_checkoutPage.scss';

/*
  multi-step checkout wizard.
  simplified for flat relational database schema.
*/
const CheckoutPage = () => {
  const { cart, cartTotal, products, profile, discountValue, cartTotalAfterDiscount } = useAppContext();

  const initialFormData = {
    name: profile.name || '',
    surname: profile.surname || '',
    email: profile.email || '',
    phone: profile.phone || '',
    address: profile.address || '',
    house_number: profile.house_number || '',
    flat_number: profile.flat_number || '',
    postalCode: profile.postalCode || '',
    city: profile.city || '',
    country: profile.country || '',

    shippingMethod: 'standard', 
    paymentMethod: 'card', 
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  };

  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (cart.length === 0 && currentStep < 4) {
      navigate('/products');
    }
  }, [cart, navigate, currentStep]);

  /*
    aggregate cart items with full product data for summary display.
    removed variant dependency.
  */
  const cartItemsData = cart.map(item => {
    const product = products.find(p => p.id == item.productId);
    if (!product) return null;

    const unitPrice = Number(product.price) || 0;
    
    return {
      ...item,
      name: product.name,
      variantColor: 'Default',
      imageUrl: product.image_url || '/img/placeholder.jpg',
      itemSize: item.size,
      unitPrice: unitPrice,
      totalPrice: unitPrice * item.quantity,
    };
  }).filter(item => item !== null);

  const shippingCost = formData.shippingMethod === 'express' ? 15 : 5;
  const totalWithShipping = (Number(cartTotalAfterDiscount) || 0) + shippingCost;

  const nextStep = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderStep = () => {
    const commonProps = { nextStep, prevStep, formData, setFormData };

    switch (currentStep) {
      case 1:
        return <Step1Details {...commonProps} />;
      case 2:
        return <Step2Shipping {...commonProps} cartTotal={cartTotal} />;
      case 3:
        return <Step3Payment {...commonProps} />;
      case 4:
        return <Step4Summary 
                  {...commonProps} 
                  cartTotal={totalWithShipping} 
                  shippingCost={shippingCost}
                  cartItems={cartItemsData} 
                  discountValue={discountValue}
               />;
      default:
        return <h1>Error during order processing.</h1>;
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-progress">
        <span className={currentStep >= 1 ? 'active' : ''}>1. Details</span>
        <span className={currentStep >= 2 ? 'active' : ''}>2. Shipping</span>
        <span className={currentStep >= 3 ? 'active' : ''}>3. Payment</span>
        <span className={currentStep >= 4 ? 'active' : ''}>4. Summary</span>
      </div>

      {renderStep()}
    </div>
  );
};

export default CheckoutPage;