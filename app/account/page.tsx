import AccountSettings from './settings';
import PageFrame from '../page-frame';
export default function AccountPage(){return <PageFrame title="계정 설정" className="account-page"><div className="settings-layout"><section className="settings-section"><h2>내 정보</h2><AccountSettings /></section></div></PageFrame>}
