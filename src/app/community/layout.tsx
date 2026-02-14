import type { Metadata } from "next";
import Link from "next/link";
import styles from "./CommunityLayout.module.scss";

export const metadata: Metadata = {
  title: "Community",
  description: "Join supportive group chats. Create or discover community spaces that feel safe for you.",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.communityLayout}>
      <header className={styles.communityLayoutHeader}>
        <div className={styles.communityLayoutHeaderInner}>
          <Link href="/home" className={styles.backLink}>
            ← Home
          </Link>
          <Link href="/community" className={styles.brand}>
            Community
          </Link>
        </div>
      </header>
      <div className={styles.communityLayoutContent}>
        {children}
      </div>
    </div>
  );
}
