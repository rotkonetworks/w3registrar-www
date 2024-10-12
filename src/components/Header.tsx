import UserDropdown from './UserDropdown';
import NetworkDropdown from './NetworkDropdown';


const Header = ({ displayName, onSelectAccount, onRemoveIdentity, onLogout }) => (
  <div className="flex justify-between items-center mb-6">
    <UserDropdown
      displayName={displayName}
      onSelectAccount={onSelectAccount}
      onRemoveIdentity={onRemoveIdentity}
      onLogout={onLogout}
    />
    <NetworkDropdown />
  </div>
);

export default Header;
