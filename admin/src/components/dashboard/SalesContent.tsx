import SalesHeader from "./SalesHeader";
import SalesKpiRow from "./SalesKpiRow";
import SalesFilterBar from "./SalesFilterBar";
import SalesEvolutionChart from "./SalesEvolutionChart";
import PaymentBreakdown from "./PaymentBreakdown";
import TransactionsTable from "./TransactionsTable";
import styles from "./SalesContent.module.css";

export default function SalesContent() {
  return (
    <div className={styles.page}>
      <SalesHeader />
      <SalesKpiRow />
      <SalesFilterBar />

      <div className={styles.analyticsGrid}>
        <div className={styles.chartCol}>
          <SalesEvolutionChart />
        </div>
        <div className={styles.paymentCol}>
          <PaymentBreakdown />
        </div>
      </div>

      <TransactionsTable />
    </div>
  );
}
