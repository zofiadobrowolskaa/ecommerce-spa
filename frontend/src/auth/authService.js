import SHA256 from 'crypto-js/sha256';

/*
security disclaimer:
- this authentication service uses client-side hashing (SHA256) and generates JWTs 
purely within the browser for demonstration purposes

- not suitable for production use.
*/

const AUTH_TOKEN_KEY = 'authToken';

// decode jwt payload
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

// generate mock jwt token
const generateToken = (userId, email) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      email,
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
  );
  const signature = 'simulated_signature';
  return `${header}.${payload}.${signature}`;
};

export const authService = {
  // register new user
  register: (email, password, name, surname) => {
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');

    if (existingUsers.some((u) => u.email === email)) {
      throw new Error('Email already registered');
    }

    const userId = `USER-${Date.now()}`;
    const passwordHash = SHA256(password).toString();

    // create user object with default profile fields
    const newUser = {
      userId,
      email,
      name,
      surname,
      passwordHash,
      role: email === 'admin@aura.com' ? 'admin' : 'client',
      createdAt: new Date().toISOString(),
      phone: '',
      address: '',
      house_number: '',
      flat_number: '',
      postalCode: '',
      city: '',
      country: '',
    };

    existingUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(existingUsers));

    const token = generateToken(userId, email);
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    return newUser;
  },

  // authenticate user
  login: (email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u) => u.email === email);

    if (!user) throw new Error('Invalid email or password');

    const inputHash = SHA256(password).toString();
    if (inputHash !== user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user.userId, user.email);
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    return user;
  },

  // clear auth token
  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  // get authenticated user
  getCurrentUser: () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return null;

    const payload = parseJwt(token);
    if (!payload || payload.exp < Date.now()) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u) => u.userId === payload.sub);

    return user || null;
  },

  // check auth state
  isAuthenticated: () => {
    return !!authService.getCurrentUser();
  },

  // update user profile data
  updateUser: (updatedUserData) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(
      (u) => u.email === updatedUserData.email
    );

    if (userIndex !== -1) {
      const currentUser = users[userIndex];

      // merge updates while preserving id and password
      const updatedUser = {
        ...currentUser,
        ...updatedUserData,
        userId: currentUser.userId,
        passwordHash: currentUser.passwordHash,
      };

      users[userIndex] = updatedUser;
      localStorage.setItem('users', JSON.stringify(users));

      return updatedUser;
    }

    throw new Error('User not found');
  },
};
