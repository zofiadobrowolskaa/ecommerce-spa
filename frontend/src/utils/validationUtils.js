/*
  luhn algorithm for validating credit card numbers.
  returns true if the card number is valid, false otherwise.
*/
export const luhnCheck = (cardNumber) => {
    if (!cardNumber) return false;

    // remove all non-digit characters
    const cleaned = ('' + cardNumber).replace(/\D/g, ''); 
    if (cleaned.length < 13 || cleaned.length > 19) return false;

    let sum = 0;
    let alternate = false;
    
    // iterate over digits from right to left
    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned.charAt(i), 10);
        if (alternate) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        alternate = !alternate;
    }

    // card is valid if sum modulo 10 is 0
    return (sum % 10 === 0);
};

/*
  professional email validation
  returns true if valid, false otherwise.
*/
export const validateEmail = (email) => {
  if (!email) return false;

  // regex pattern for professional email validation
  const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  
  return emailRegex.test(email.trim());
};

/*
  helper to validate credit card expiration date in MM/YY format.
  returns true if the date is valid and in the future, false otherwise.
*/
export const isNotExpired = (value) => {
  if (!value) return true; // empty value will be handled by required validation
  if (!/^\d{2}\/\d{2}$/.test(value)) return false; // must match MM/YY format

  const [monthStr, yearStr] = value.split('/');
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100; // last two digits of year
  const currentMonth = now.getMonth() + 1;

  // check if the card is expired
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
};
