import ValidationHeader from "./ValidationHeader";
import ValidationKpiRow from "./ValidationKpiRow";
import ValidEntryBanner from "./ValidEntryBanner";
import ValidatorConsole from "./ValidatorConsole";
import GatesTable from "./GatesTable";
import IncidentLog from "./IncidentLog";
import HelpDeskBar from "./HelpDeskBar";
import styles from "./ValidationContent.module.css";

export default function ValidationContent() {
  return (
    <div className={styles.page}>
      <ValidationHeader />
      <ValidationKpiRow />
      <ValidEntryBanner />

      <div className={styles.consoleGrid}>
        <div className={styles.consoleCol}>
          <ValidatorConsole />
        </div>
        <div className={styles.gatesCol}>
          <GatesTable />
        </div>
      </div>

      <IncidentLog />
      <HelpDeskBar />
    </div>
  );
}
