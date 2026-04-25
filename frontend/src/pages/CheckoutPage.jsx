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
  manages navigation through steps: Details -> Shipping -> Payment -> Summary.
*/
const CheckoutPage = () => {
  const { cart, cartTotal, products, profile, discountValue, cartTotalAfterDiscount } = useAppContext();

  /*
    initialize form data with profile values if available.
    ensures previously entered profile data pre-fills future orders.
  */
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
  // current step of the checkout wizard (1-4)
  const [currentStep, setCurrentStep] = useState(1);
  // global form state for all steps
  const [formData, setFormData] = useState(initialFormData);

  // redirect to products page if cart is empty and user tries to access checkout manually.
  useEffect(() => {
    if (cart.length === 0 && currentStep < 4) {
      navigate('/products');
    }
  }, [cart, navigate, currentStep]);

  /*
    aggregate cart items with full product data for summary display.
    combines cart IDs with product info (name, image, variant, price).
  */
  const cartItemsData = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    const variant = product?.variants.find(v => v.id === item.variantId);
    if (!product || !variant) return null;

    const unitPrice = product.price + variant.priceAdjustment;
    return {
      ...item,
      name: product.name,
      variantColor: variant.color,
      imageUrl: variant.imageUrl,
      itemSize: item.size,
      unitPrice: unitPrice,
      totalPrice: unitPrice * item.quantity,
    };
  }).filter(item => item !== null);

  // calculate shipping cost based on selected method
  const shippingCost = formData.shippingMethod === 'express' ? 15 : 5;
  const totalWithShipping = cartTotalAfterDiscount + shippingCost;

  /*
    navigate to next step and merge step data into global form state.
    preserves entered data when going back and forth.
  */
  const nextStep = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /*
    dynamically render the component for the current step.
    commonProps object demonstrates passing shared properties to all step components.
  */
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

      {/* render the current step of the wizard */}
      {renderStep()}
    </div>
  );
};

export default CheckoutPage;
