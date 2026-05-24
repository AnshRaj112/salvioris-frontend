"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Award, Shield, MapPin, Calendar, ArrowRight, Activity, ChevronRight, Inbox } from "lucide-react";
import { api, ApiError } from "../lib/api";
import styles from "./TherapistsSearch.module.scss";

interface TherapistItem {
  id: string;
  name: string;
  license_state: string;
  years_of_experience: number;
  specialization?: string;
  college_degree?: string;
  masters_institution?: string;
  psychologist_type?: string;
  successful_cases?: number;
  therapy_types?: string;
  availability_status: string;
}

export default function TherapistSearchDirectory() {
  const [therapists, setTherapists] = useState<TherapistItem[]>([]);
  const [specialization, setSpecialization] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDirectory();
  }, [specialization, location, availability]);

  const fetchDirectory = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.searchTherapists({
        specialization: specialization || undefined,
        location: location || undefined,
        availability: availability || undefined,
        q: searchQuery || undefined,
      });

      if (res.success) {
        setTherapists(res.therapists || []);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setErrorMsg(apiError.message || "Failed to load therapist directory.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDirectory();
  };

  return (
    <div className={styles.searchPage}>
      {/* Premium Header */}
      <header className={styles.header}>
        <div className={styles.brandWrapper}>
          <div className={styles.logoIcon}>
            <Shield className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className={styles.brandName}>
              SALVIORIS <span className={styles.badge}>Clinical Registry</span>
            </h1>
            <p className="text-xs text-slate-400" style={{ margin: 0, marginTop: '2px' }}>Discover and securely connect with certified practitioners</p>
          </div>
        </div>

        <Link 
          href="/home" 
          className={styles.backHomeLink}
        >
          Back to Home <ChevronRight className="h-3 w-3" />
        </Link>
      </header>

      {/* Main Content Workspace */}
      <main className={styles.mainContainer}>
        
        {/* Filters Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.filterHeader}>
            <Filter className="h-4.5 w-4.5 text-emerald-400" style={{ marginRight: '0.25rem' }} />
            <h2 className={styles.filterTitle}>Search Filters</h2>
          </div>

          {/* Specialization Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.label}>Clinical Speciality</label>
            <select 
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className={styles.select}
            >
              <option value="">All Specializations</option>
              <option value="anxiety">Anxiety & Panic</option>
              <option value="depression">Depression & Mood Disorders</option>
              <option value="trauma">Trauma & PTSD</option>
              <option value="relationship">Couples & Relationships</option>
              <option value="cbt">Cognitive Behavioral Therapy (CBT)</option>
            </select>
          </div>

          {/* Location / License State Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.label}>Licensing Location / State</label>
            <input 
              type="text" 
              placeholder="e.g. California, NY"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Availability Status */}
          <div className={styles.checkboxRow}>
            <span className={styles.checkboxLabel}>
              <Calendar className="h-4 w-4 text-emerald-400" style={{ marginRight: '0.25rem' }} /> Show Available Only
            </span>
            <input 
              type="checkbox" 
              checked={availability}
              onChange={(e) => setAvailability(e.target.checked)}
              className={styles.checkbox}
            />
          </div>

          {/* Secure Guarantee */}
          <div className={styles.guaranteeCard}>
            <h4 className={styles.guaranteeTitle}>
              <Shield className="h-3.5 w-3.5 text-emerald-400" style={{ marginRight: '0.25rem' }} /> Verification Guarantee
            </h4>
            All listed clinical therapists have undergone active state credential verification and administrative background approval.
          </div>
        </aside>

        {/* Directory Grid */}
        <section className={styles.resultsSection}>
          
          {/* Direct Search bar */}
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <div className={styles.searchWrapper}>
              <Search className={`${styles.searchIcon} h-4.5 w-4.5`} />
              <input 
                type="text" 
                placeholder="Search therapists by name, degree, focus area..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button 
              type="submit"
              className={styles.searchButton}
            >
              Search
            </button>
          </form>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl text-rose-400 text-xs" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              {errorMsg}
            </div>
          )}

          {/* Therapists listing */}
          {isLoading ? (
            <div className={styles.loader}>
              <Activity className="h-8 w-8 text-emerald-400 animate-spin" />
              <span className="text-xs">Loading therapist directory...</span>
            </div>
          ) : therapists.length === 0 ? (
            <div className={styles.emptyState}>
              <Inbox className="h-10 w-10 text-slate-500" />
              <div>
                <h3 className={styles.emptyTitle}>No Therapists Found</h3>
                <p className={styles.emptyText}>
                  We couldn't find any certified therapists matching those filter options. Try expanding your filters or search keywords.
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.grid}>
              {therapists.map((t) => (
                <div 
                  key={t.id} 
                  className={styles.card}
                >
                  <div className={styles.cardInfo}>
                    <div className={styles.cardHeaderRow}>
                      <h3 className={styles.therapistName}>Dr. {t.name}</h3>
                      <span className={styles.verifiedBadge}>
                        Verified Partner
                      </span>
                    </div>

                    <div className={styles.metaRow}>
                      <span className={styles.metaItem}>
                        <MapPin className="h-3.5 w-3.5 text-slate-550" /> licensed in {t.license_state}
                      </span>
                      <span className={styles.metaItem}>
                        <Award className="h-3.5 w-3.5 text-slate-550" /> {t.years_of_experience} yrs experience
                      </span>
                      <span className={styles.metaItem}>
                        <Activity className="h-3.5 w-3.5 text-slate-550" /> {t.availability_status}
                      </span>
                    </div>

                    {t.specialization && (
                      <p className={styles.specializationText}>
                        Specializes in: <strong className={styles.specBold}>{t.specialization}</strong>
                      </p>
                    )}

                    {t.therapy_types && (
                      <div className={styles.tagContainer}>
                        {t.therapy_types.split(",").slice(0, 3).map((type, idx) => (
                          <span key={idx} className={styles.tag}>
                            {type.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link href={`/therapists/${t.id}`} style={{ textDecoration: 'none' }} className={styles.viewProfileButton}>
                    View Profile <ArrowRight className="h-4 w-4" style={{ marginLeft: '0.25rem' }} />
                  </Link>
                </div>
              ))}
            </div>
          )}

        </section>

      </main>
    </div>
  );
}
