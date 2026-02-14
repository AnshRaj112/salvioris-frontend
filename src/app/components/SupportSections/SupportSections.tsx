import type { ReactNode } from "react";
import styles from "./SupportSections.module.scss";

type Props = {
  pageTitle: string;
  userTitle: string;
  userContent: ReactNode;
  therapistTitle: string;
  therapistContent: ReactNode;
};

export function SupportSections({
  pageTitle,
  userTitle,
  userContent,
  therapistTitle,
  therapistContent,
}: Props) {
  return (
    <div className={styles.wrapper}>
      <section className={styles.userSection} aria-label={`${pageTitle} for users`}>
        <div className={styles.userContainer}>
          <div className={styles.userCard}>
            <span className={styles.userBadge}>For users</span>
            <h1 className={styles.userTitle}>{userTitle}</h1>
            <div className={styles.userContent}>{userContent}</div>
          </div>
        </div>
      </section>

      <section className={styles.therapistSection} aria-label={`${pageTitle} for therapists`}>
        <div className={styles.therapistContainer}>
          <div className={styles.therapistCard}>
            <span className={styles.therapistBadge}>For therapists</span>
            <h2 className={styles.therapistTitle}>{therapistTitle}</h2>
            <div className={styles.therapistContent}>{therapistContent}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
