import Image from "next/image";
import { Button } from "../ui/therapistbutton";
import { CardTherapist, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/CardTherapist";
import { Badge } from "../ui/badge";
import { Star, MessageCircle, Video, Calendar } from "lucide-react";
import styles from "./scss/TherapistGrid.module.scss";

const therapists = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    specialty: "Anxiety & Depression",
    rating: 4.9,
    reviews: 127,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    price: "$120/session",
    availableToday: true,
    badges: ["LGBTQ+ Friendly", "Trauma Specialist"]
  },
  {
    id: 2,
    name: "Dr. Michael Rodriguez",
    specialty: "Relationship Therapy",
    rating: 4.8,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
    price: "$100/session",
    availableToday: false,
    badges: ["Couples Therapy", "Family Counseling"]
  },
  {
    id: 3,
    name: "Dr. Emily Watson",
    specialty: "Cognitive Behavioral Therapy",
    rating: 4.9,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1594824708379-a5b6f2de8de9?w=150&h=150&fit=crop&crop=face",
    price: "$110/session",
    availableToday: true,
    badges: ["CBT Specialist", "Mindfulness"]
  }
];

const TherapistGrid = () => {
  return (
    <section className={`${styles.therapistGrid} ${styles.comingSoonSection}`}>
      <div className={styles.comingSoonBadge}>Coming Soon</div>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Find Your Perfect
            <span className={styles.titleHighlight}>
              Therapist
            </span>
          </h2>
          <p className={styles.subtitle}>
            Connect with licensed mental health professionals who understand your unique needs
          </p>
        </div>
        
        <div className={styles.grid}>
          {therapists.map((therapist) => (
            <CardTherapist key={therapist.id} className="group hover:scale-[1.02] transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="relative mx-auto mb-4">
                  <Image
                    src={therapist.image}
                    alt={therapist.name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover mx-auto shadow-soft"
                  />
                  {therapist.availableToday && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full border-2 border-card flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                
                <CardTitle className="text-xl mb-2">{therapist.name}</CardTitle>
                <CardDescription className="text-secondary font-medium">
                  {therapist.specialty}
                </CardDescription>
                
                <div className="flex items-center justify-center gap-1 mt-2 flex-wrap">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-sm">{therapist.rating}</span>
                  <span className="text-muted-foreground text-xs sm:text-sm">({therapist.reviews} reviews)</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {therapist.badges.map((badge) => (
                    <Badge key={badge} variant="secondary" className="text-xs px-2 py-1">
                      {badge}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <span className="font-heading text-base sm:text-lg font-semibold text-primary">
                    {therapist.price}
                  </span>
                  <span className={`text-xs sm:text-sm px-2 py-1 rounded-full whitespace-nowrap ${
                    therapist.availableToday 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {therapist.availableToday ? 'Available Today' : 'Book Ahead'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1.5 sm:px-2">
                    <MessageCircle className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Chat</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1.5 sm:px-2">
                    <Video className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Video</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1.5 sm:px-2">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Book</span>
                  </Button>
                </div>
                
                <Button variant="soothing" className="w-full">
                  Connect Now
                </Button>
              </CardContent>
            </CardTherapist>
          ))}
        </div>
        
        <div className={styles.footer}>
          <Button variant="outline" size="default" className="w-full sm:w-auto">
            View All Therapists
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TherapistGrid;