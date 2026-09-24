import RolesHeader from "./RolesHeader";
import RoleTabsBar from "./RoleTabsBar";
import RoleCardsGrid from "./RoleCardsGrid";
import TeamMembersTable from "./TeamMembersTable";
import PermissionsMatrix from "./PermissionsMatrix";
import styles from "./RolesContent.module.css";

export default function RolesContent() {
  return (
    <div className={styles.page}>
      <RolesHeader />
      <RoleTabsBar />
      <RoleCardsGrid />
      <TeamMembersTable />
      <PermissionsMatrix />
    </div>
  );
}
