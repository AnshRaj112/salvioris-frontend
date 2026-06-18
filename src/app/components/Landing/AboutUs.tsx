import { 
    MessageCircle, 
    Shield, 
    Clock, 
    BookOpen, 
    Calendar,
  } from "lucide-react";
  import { Card, CardContent} from "../ui/card";
  import styles from "./scss/AboutUs.module.scss";

  export default function AboutUs() {
    const features = [
      {
        icon: MessageCircle,
        title: "Secure Chat & Video",
        description: "Connect with therapists through encrypted messaging and video calls",
        comingSoon: true,
      },
      {
        icon: Shield,
        title: "Verified Therapists",
        description: "All professionals are licensed and background-checked",
        comingSoon: true,
      },
      {
        icon: Clock,
        title: "Real-Time Support",
        description: "Get help when you need it with 24/7 availability",
        comingSoon: true,
      },
      {
        icon: BookOpen,
        title: "Emotional Journaling",
        description: "Express yourself safely and track your mental health journey",
      },
    ];
    return (
<section className={styles.aboutUs}>
 <div className={styles.container}>
   <div className={styles.header}>
     <h2 className={styles.title}>
       Creating Safe Spaces for 
       <span className={styles.titleHighlight}> Mental Wellness</span>
     </h2>
     <p className={styles.description}>
       At SALVIORIS, we believe everyone deserves access to quality mental healthcare. 
       Our platform connects you with licensed professionals in a secure, judgement-free 
       environment designed for healing and growth.
     </p>
   </div>

    <div className={styles.featuresGrid}>
      {features.map((feature) => {
        const IconComponent = feature.icon;
        return (
       <Card key={feature.title} className={`${styles.featureCard} ${feature.comingSoon ? styles.comingSoonCard : ''}`}>
         {feature.comingSoon && (
           <div className={styles.comingSoonBadge}>Coming Soon</div>
         )}
         <CardContent className={styles.featureCardContent}>
           <div className={styles.iconWrapper}>
             <IconComponent className={styles.icon} />
           </div>
           <h3 className={styles.featureTitle}>
             {feature.title}
           </h3>
           <p className={styles.featureDescription}>
             {feature.description}
           </p>
         </CardContent>
       </Card>
      )})}
    </div>

    {/* Google Calendar Integration & Platform Purpose Section */}
    <div className={styles.calendarSection}>
      <div className={styles.calendarCard}>
        <div className={styles.calendarHeader}>
          <div className={styles.calendarIconWrapper}>
            <Calendar className={styles.calendarIcon} />
          </div>
          <h3 className={styles.calendarTitle}>
            Google Calendar Integration & Platform Purpose
          </h3>
        </div>
        <div className={styles.calendarContent}>
          <p className={styles.calendarText}>
            <strong>SALVIORIS</strong> is a mental health platform that connects patients with licensed therapists and mental health professionals.
          </p>
          <p className={styles.calendarText}>
            Users can book therapy appointments, manage their wellness journey, track mood and mental health metrics, and communicate with healthcare providers through the platform.
          </p>
          <p className={styles.calendarText}>
            <strong>Google Calendar integration</strong> is used to automatically create, update, and manage therapy appointments on users&apos; calendars. This helps both patients and therapists receive reminders, avoid scheduling conflicts, and stay informed about upcoming sessions.
          </p>
          <p className={styles.calendarText}>
            SALVIORIS only accesses Google Calendar data necessary to schedule and manage appointments initiated by the user.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
    );
}