import ConfigHeader from "./ConfigHeader";
import ConfigTabsBar from "./ConfigTabsBar";
import OrganizationProfile from "./OrganizationProfile";
import PaymentGatewaysCard from "./PaymentGatewaysCard";
import SecurityPoliciesCard from "./SecurityPoliciesCard";
import SettlementCard from "./SettlementCard";
import AccountHealthCard from "./AccountHealthCard";
import StickySaveBar from "./StickySaveBar";
import styles from "./ConfigContent.module.css";

export default function ConfigContent() {
  return (
    <div className={styles.page}>
      <ConfigHeader />
      <ConfigTabsBar />

      <div className={styles.grid}>
        <div className={styles.mainCol}>
          <OrganizationProfile />
          <PaymentGatewaysCard />
          <SecurityPoliciesCard />
        </div>
        <div className={styles.sideCol}>
          <SettlementCard />
          <AccountHealthCard />
        </div>
      </div>

      <StickySaveBar />
    </div>
  );
}
