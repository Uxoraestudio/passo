import ClientsHeader from "./ClientsHeader";
import ClientsKpiRow from "./ClientsKpiRow";
import ClientsDirectory from "./ClientsDirectory";
import AiSegmentationBanner from "./AiSegmentationBanner";
import styles from "./ClientsContent.module.css";

export default function ClientsContent() {
  return (
    <div className={styles.page}>
      <ClientsHeader />
      <ClientsKpiRow />
      <ClientsDirectory />
      <AiSegmentationBanner />
    </div>
  );
}
