import ReportsHeader from "./ReportsHeader";
import ReportsFilterBar from "./ReportsFilterBar";
import ReportsKpiRow from "./ReportsKpiRow";
import SCurveChart from "./SCurveChart";
import LocalityBreakdown from "./LocalityBreakdown";
import GeoBreakdown from "./GeoBreakdown";
import ActionAlerts from "./ActionAlerts";
import SettlementsTable from "./SettlementsTable";
import SecurityStrip from "./SecurityStrip";
import styles from "./ReportsContent.module.css";

export default function ReportsContent() {
  return (
    <div className={styles.page}>
      <ReportsHeader />
      <ReportsFilterBar />
      <ReportsKpiRow />

      <div className={styles.analyticsGrid}>
        <div className={styles.chartCol}>
          <SCurveChart />
        </div>
        <div className={styles.sideCol}>
          <LocalityBreakdown />
          <GeoBreakdown />
        </div>
      </div>

      <ActionAlerts />
      <SettlementsTable />
      <SecurityStrip />
    </div>
  );
}
