import TicketsEventHeader from "./TicketsEventHeader";
import TicketsKpiRow from "./TicketsKpiRow";
import SalesPhases from "./SalesPhases";
import SectorsTable from "./SectorsTable";
import VenueMap from "./VenueMap";
import CourtesyForm from "./CourtesyForm";
import SecurityToggles from "./SecurityToggles";
import styles from "./TicketsContent.module.css";

export default function TicketsContent() {
  return (
    <div className={styles.page}>
      <TicketsEventHeader />
      <TicketsKpiRow />
      <SalesPhases />

      <div className={styles.sectorsGrid}>
        <div className={styles.sectorsTableCol}>
          <SectorsTable />
        </div>
        <div className={styles.venueMapCol}>
          <VenueMap />
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.courtesyCol}>
          <CourtesyForm />
        </div>
        <div className={styles.securityCol}>
          <SecurityToggles />
        </div>
      </div>
    </div>
  );
}
