import UserDropdown from './UserDropdown';
import NetworkDropdown from './NetworkDropdown';
import { BalanceIndicator } from './header/BalanceIndicator';


const Header = () => (
  <div className="flex justify-between items-center mb-6">
    <UserDropdown />
    <BalanceIndicator />
    <NetworkDropdown />
  </div>
);

export default Header;
