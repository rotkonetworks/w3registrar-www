import React from 'react';
import UserDropdown from './UserDropdown';
import NetworkDropdown from './NetworkDropdown';
import { accountStore } from '~/store/accountStore';

const Header: React.FC = () => {
  const handleLogout = () => {
    accountStore.update('');
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <UserDropdown onLogout={handleLogout} />
      <NetworkDropdown />
    </div>
  );
};

export default Header;
