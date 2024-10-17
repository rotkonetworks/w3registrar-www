import { proxy } from 'valtio'
import { LocalStorageUtil } from '~/utils'

export const accountStore = proxy({
  selectedAccount: LocalStorageUtil.getItem<string | null>('selectedAccount'),
  update: (newAccount: string | null) => {
    accountStore.selectedAccount = newAccount;
    if (newAccount) {
      LocalStorageUtil.setItem('selectedAccount', newAccount);
    } else {
      LocalStorageUtil.removeItem('selectedAccount');
    }
  }
});
