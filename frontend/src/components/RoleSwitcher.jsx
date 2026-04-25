import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/_layout.scss';

/*
  allows switching user roles at runtime.
  used to simulate rbac behavior.
 */

const RoleSwitcher = () => {
  const { userRole, loginAs } = useAppContext();

  const navigate = useNavigate();

  // handle role toggle logic
  const handleSwitch = () => {
    const newRole = userRole === 'client' ? 'admin' : 'client';

    // update global state and local storage
    loginAs(newRole);

    if (newRole === 'client') {
      navigate('/', { replace: true });
    } else {
      navigate('/admin', { replace: true });
    }
  };

  return (
    <div className="role-switcher-container">
      Current role:{' '}
      <span className="current-role">{userRole.toUpperCase()}</span>

      <button onClick={handleSwitch}>
        Switch to {userRole === 'client' ? 'Administrator' : 'Client'}
      </button>
    </div>
  );
};

export default RoleSwitcher;
