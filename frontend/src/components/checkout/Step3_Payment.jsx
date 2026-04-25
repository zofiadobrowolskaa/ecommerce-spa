import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { luhnCheck, isNotExpired } from '../../utils/validationUtils';

const Step3Schema = Yup.object().shape({
  paymentMethod: Yup.string()
    .oneOf(['card', 'transfer'], 'Invalid payment method')
    .required('Please select a payment method'),

  // conditional validation: card fields are validated only if paymentMethod === 'card'
  cardNumber: Yup.string().when('paymentMethod', {
    is: 'card',
    then: (schema) => schema
      .required('Card number is required')
      .matches(/^[0-9\s]+$/, 'Card number must contain only digits')
      .test('luhn-check', 'Invalid card number (Luhn check failed)', (value) => {
        // remove spaces before validation
        return luhnCheck(value?.replace(/\s/g, ''));
      }),
    otherwise: (schema) => schema.notRequired(),
  }),

  expiryDate: Yup.string().when('paymentMethod', {
    is: 'card',
    then: (schema) => schema
      .required('Expiry date is required')
      .matches(/^\d{2}\/\d{2}$/, 'Format MM/YY (e.g. 12/25)')
      .test('is-future', 'Card has expired', isNotExpired),
    otherwise: (schema) => schema.notRequired(),
  }),

  cvv: Yup.string().when('paymentMethod', {
    is: 'card',
    then: (schema) => schema
      .required('CVV is required')
      .matches(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const Step3Payment = ({ nextStep, prevStep, formData, setFormData }) => {

  // handle form submission
  const handleSubmit = (values) => {
    // clear card data if payment method is bank transfer for security
    const finalValues = values.paymentMethod === 'transfer'
      ? { ...values, cardNumber: '', expiryDate: '', cvv: '' }
      : values;

    // update parent form state and proceed to next step
    setFormData(prev => ({ ...prev, ...finalValues }));
    nextStep(finalValues);
  };

  return (
    <Formik
      initialValues={{
        paymentMethod: formData.paymentMethod || 'card',
        cardNumber: formData.cardNumber || '',
        expiryDate: formData.expiryDate || '',
        cvv: formData.cvv || ''
      }}
      validationSchema={Step3Schema}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, setFieldValue }) => (
        <Form className="checkout-step">
          <h2>3. Payment Method</h2>
          
          <div className="payment-options">
            <label className={`radio-label ${values.paymentMethod === 'card' ? 'selected' : ''}`}>
              <Field type="radio" name="paymentMethod" value="card" />
              <span className="radio-text">Card</span>
            </label>
            <label className={`radio-label ${values.paymentMethod === 'transfer' ? 'selected' : ''}`}>
              <Field type="radio" name="paymentMethod" value="transfer" />
              <span className="radio-text">Bank Transfer</span>
            </label>
          </div>
          <ErrorMessage name="paymentMethod" component="p" className="error-message" />

          {/* conditional rendering: card input fields */}
          {values.paymentMethod === 'card' && (
            <div className="card-details fade-in">
              <div className="form-group-wrapper">
                <Field 
                  type="text" 
                  name="cardNumber" 
                  placeholder="Card Number (16 digits)" 
                  maxLength="19"
                  className={touched.cardNumber && errors.cardNumber ? 'input-error' : ''}
                />
                <ErrorMessage name="cardNumber" component="p" className="error-message" />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group-wrapper" style={{ flex: 1 }}>
                  <Field
                    type="text"
                    name="expiryDate"
                    placeholder="MM/YY"
                    maxLength="5"
                    className={touched.expiryDate && errors.expiryDate ? 'input-error' : ''}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length >= 3) val = `${val.slice(0,2)}/${val.slice(2,4)}`;
                      setFieldValue('expiryDate', val);
                    }}
                  />
                  <ErrorMessage name="expiryDate" component="p" className="error-message" />
                </div>

                <div className="form-group-wrapper" style={{ flex: 1 }}>
                  <Field
                    type="text"
                    name="cvv"
                    placeholder="CVV"
                    maxLength="4"
                    className={touched.cvv && errors.cvv ? 'input-error' : ''}
                  />
                  <ErrorMessage name="cvv" component="p" className="error-message" />
                </div>
              </div>
            </div>
          )}

          {/* conditional rendering: bank transfer instructions */}
          {values.paymentMethod === 'transfer' && (
            <div className="bank-transfer-info fade-in">
              <p><strong>Bank transfer details:</strong></p>
              <p>Bank: Example Bank</p>
              <p>Account: 12 3456 7890 1234 5678 9012</p>
              <p className="info">Instructions will be sent to your email.</p>
            </div>
          )}

          <div className="button-group">
            <button type="button" onClick={prevStep}>Go back</button>
            <button type="submit">Next to Summary</button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default Step3Payment;
