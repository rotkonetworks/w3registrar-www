import UserDropdown from './UserDropdown';
import NetworkDropdown from './NetworkDropdown';
import { BalanceIndicator } from './header/BalanceIndicator';
import { useSnapshot } from 'valtio';
import { appState } from '~/App';


const Header = () => {
  const appStateSnap = useSnapshot(appState)

  return (
    <div className="flex justify-between items-center mb-6">
      <UserDropdown />
      {appStateSnap.account && <BalanceIndicator />}
      <NetworkDropdown />
    </div>
  );
};

export default Header;
