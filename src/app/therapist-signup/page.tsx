"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Heart, ArrowRight, Shield, Users, Award, Eye, EyeOff, GraduationCap, FileText, Upload, BookOpen } from "lucide-react";
import Image from "next/image";
import salviorisLogo from "../../assets/salvioris.jpg";
import { api, ApiError } from "../lib/api";
import styles from "./TherapistSignup.module.scss";

export default function TherapistSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
    licenseState: "",
    yearsOfExperience: "",
    specialization: "",
    phone: "",
    collegeDegree: "",
    mastersInstitution: "",
    certificateImage: null as File | null,
    degreeImage: null as File | null,
    successfulCases: "",
    dsmAwareness: "",
    psychologistType: "",
    therapyTypes: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [uploadingDegree, setUploadingDegree] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      console.log(`File selected for ${fieldName}:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type. Please upload JPG, PNG, or PDF files.`);
        e.target.value = ''; // Clear the input
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError(`File size too large. Please upload files smaller than 10MB.`);
        e.target.value = ''; // Clear the input
        return;
      }

      // Set file in form data
      setFormData({
        ...formData,
        [fieldName]: file,
      });
      console.log(`File set in formData for ${fieldName}:`, file.name);
      setError(null);
    } else {
      console.log(`No file selected for ${fieldName}`);
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      // Validate step 1 fields
      if (formData.name && formData.email && formData.password && formData.confirmPassword) {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        setError(null);
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      // Validate step 2 fields
      if (formData.licenseNumber && formData.licenseState && formData.yearsOfExperience && formData.phone) {
        setError(null);
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate files are selected
      if (!formData.certificateImage) {
        setError("Please select your certificate/license image");
        setIsLoading(false);
        return;
      }

      if (!formData.degreeImage) {
        setError("Please select your degree image");
        setIsLoading(false);
        return;
      }

      // Create FormData with ALL fields and BOTH files in ONE request
      const multipartFormData = new FormData();
      
      // Append form fields
      multipartFormData.append('name', formData.name);
      multipartFormData.append('email', formData.email);
      multipartFormData.append('password', formData.password);
      multipartFormData.append('license_number', formData.licenseNumber);
      multipartFormData.append('license_state', formData.licenseState);
      multipartFormData.append('years_of_experience', formData.yearsOfExperience);
      multipartFormData.append('phone', formData.phone);
      multipartFormData.append('college_degree', formData.collegeDegree);
      multipartFormData.append('masters_institution', formData.mastersInstitution);
      multipartFormData.append('psychologist_type', formData.psychologistType);
      multipartFormData.append('successful_cases', formData.successfulCases);
      multipartFormData.append('dsm_awareness', formData.dsmAwareness);
      multipartFormData.append('therapy_types', formData.therapyTypes);
      
      if (formData.specialization) {
        multipartFormData.append('specialization', formData.specialization);
      }

      // Append BOTH files with DIFFERENT keys (this is critical!)
      multipartFormData.append('certificate_image', formData.certificateImage);
      multipartFormData.append('degree_image', formData.degreeImage);

      console.log('Submitting therapist signup with multipart form data:');
      console.log('  Certificate file:', formData.certificateImage.name, formData.certificateImage.size, 'bytes');
      console.log('  Degree file:', formData.degreeImage.name, formData.degreeImage.size, 'bytes');

      // Send everything in ONE request
      const response = await api.therapistSignup(multipartFormData);
      if (response.success) {
        // Store therapist data in localStorage
        localStorage.setItem("therapist", JSON.stringify(response.user));
        // Redirect to pending approval page
        router.push("/therapist-pending");
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to submit application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.therapistSignupPage}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Story Section */}
          <div className={styles.storySection}>
            <div className={styles.storyContent}>
              <div className={styles.logoWrapper}>
                <div className={styles.logoIcon}>
                  <Image 
                    src={salviorisLogo} 
                    alt="SALVIORIS Logo" 
                    width={48} 
                    height={48}
                    className={styles.logoImage}
                  />
                </div>
                <h1 className={styles.brandName}>SALVIORIS</h1>
              </div>
              
              <h2 className={styles.storyTitle}>
                Join Our Mission to <span className={styles.highlight}>Make a Difference</span>
              </h2>
              
              <p className={styles.storyDescription}>
                Help us create a world where everyone has access to compassionate, 
                professional mental health support. Join thousands of licensed therapists 
                making a real impact.
              </p>

              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <Heart className={styles.featureIcon} />
                  <div>
                    <h3 className={styles.featureTitle}>Make a Difference</h3>
                    <p className={styles.featureText}>Help people transform their lives and find healing</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Users className={styles.featureIcon} />
                  <div>
                    <h3 className={styles.featureTitle}>Growing Community</h3>
                    <p className={styles.featureText}>Join thousands of mental health professionals</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Award className={styles.featureIcon} />
                  <div>
                    <h3 className={styles.featureTitle}>Professional Growth</h3>
                    <p className={styles.featureText}>Access continued education and development resources</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className={styles.formSection}>
            <Card className={styles.formCard}>
              <CardHeader>
                {/* Step Indicator */}
                <div className={styles.stepIndicator}>
                  <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ""}`}>
                    <div className={styles.stepNumber}>1</div>
                    <span className={styles.stepLabel}>Account</span>
                  </div>
                  <div className={`${styles.stepLine} ${currentStep >= 2 ? styles.active : ""}`}></div>
                  <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ""}`}>
                    <div className={styles.stepNumber}>2</div>
                    <span className={styles.stepLabel}>License & Contact</span>
                  </div>
                  <div className={`${styles.stepLine} ${currentStep >= 3 ? styles.active : ""}`}></div>
                  <div className={`${styles.step} ${currentStep >= 3 ? styles.active : ""}`}>
                    <div className={styles.stepNumber}>3</div>
                    <span className={styles.stepLabel}>Education & Details</span>
                  </div>
                </div>

                <CardTitle className={styles.formTitle}>
                  {currentStep === 1 
                    ? "Create Your Therapist Account" 
                    : currentStep === 2 
                    ? "License & Contact Information" 
                    : "Education & Professional Details"}
                </CardTitle>
                <p className={styles.formSubtitle}>
                  {currentStep === 1
                    ? "Start your journey to help others. Licensed professionals only."
                    : currentStep === 2
                    ? "Tell us about your license and how to reach you."
                    : "Share your educational background and professional expertise."}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={currentStep === 3 ? handleSubmit : handleNext} className={styles.form}>
                  {error && (
                    <div className={styles.errorMessage} style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
                      {error}
                    </div>
                  )}
                  {currentStep === 1 ? (
                    <>
                      <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.label}>
                          Full Name
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                          Email Address
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>
                          Password
                        </label>
                        <div className={styles.passwordWrapper}>
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className={styles.input}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={styles.eyeButton}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className={styles.eyeIcon} />
                            ) : (
                              <Eye className={styles.eyeIcon} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword" className={styles.label}>
                          Confirm Password
                        </label>
                        <div className={styles.passwordWrapper}>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className={styles.input}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className={styles.eyeButton}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className={styles.eyeIcon} />
                            ) : (
                              <Eye className={styles.eyeIcon} />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        variant="healing" 
                        className={styles.submitButton}
                        size="lg"
                      >
                        Continue
                        <ArrowRight className={styles.buttonIcon} />
                      </Button>

                      <p className={styles.loginLink}>
                        Already have an account?{" "}
                        <Link href="/therapist-signin" className={styles.link}>
                          Sign In
                        </Link>
                      </p>
                    </>
                  ) : currentStep === 2 ? (
                    <>
                      <div className={styles.formGroup}>
                        <label htmlFor="licenseNumber" className={styles.label}>
                          License Number *
                        </label>
                        <Input
                          id="licenseNumber"
                          name="licenseNumber"
                          type="text"
                          placeholder="Enter your license number"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          required
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.professionalRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="licenseState" className={styles.label}>
                            License State/Province *
                          </label>
                          <Input
                            id="licenseState"
                            name="licenseState"
                            type="text"
                            placeholder="State"
                            value={formData.licenseState}
                            onChange={handleChange}
                            required
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="yearsOfExperience" className={styles.label}>
                            Years of Experience *
                          </label>
                          <Input
                            id="yearsOfExperience"
                            name="yearsOfExperience"
                            type="number"
                            placeholder="Years"
                            value={formData.yearsOfExperience}
                            onChange={handleChange}
                            required
                            className={styles.input}
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="phone" className={styles.label}>
                          Phone Number *
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="specialization" className={styles.label}>
                          Specialization
                        </label>
                        <Input
                          id="specialization"
                          name="specialization"
                          type="text"
                          placeholder="e.g., Anxiety, Depression, Trauma, etc."
                          value={formData.specialization}
                          onChange={handleChange}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.buttonGroup}>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className={styles.backButton}
                          size="lg"
                          onClick={handleBack}
                        >
                          <ArrowRight className={styles.buttonIcon} style={{ transform: 'rotate(180deg)' }} />
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          variant="healing" 
                          className={styles.submitButton}
                          size="lg"
                        >
                          Continue
                          <ArrowRight className={styles.buttonIcon} />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.formGroup}>
                        <label htmlFor="collegeDegree" className={styles.label}>
                          College Degree *
                        </label>
                        <Input
                          id="collegeDegree"
                          name="collegeDegree"
                          type="text"
                          placeholder="e.g., Bachelor of Science in Psychology"
                          value={formData.collegeDegree}
                          onChange={handleChange}
                          required
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="mastersInstitution" className={styles.label}>
                          Where did you complete your Master&apos;s Degree? *
                        </label>
                        <Input
                          id="mastersInstitution"
                          name="mastersInstitution"
                          type="text"
                          placeholder="University/Institution name"
                          value={formData.mastersInstitution}
                          onChange={handleChange}
                          required
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="psychologistType" className={styles.label}>
                          What kind of psychologist are you? *
                        </label>
                        <select
                          id="psychologistType"
                          name="psychologistType"
                          value={formData.psychologistType}
                          onChange={handleChange}
                          required
                          className={styles.select}
                        >
                          <option value="">Select your type</option>
                          <option value="clinical">Clinical Psychologist</option>
                          <option value="counseling">Counseling Psychologist</option>
                          <option value="school">School Psychologist</option>
                          <option value="forensic">Forensic Psychologist</option>
                          <option value="health">Health Psychologist</option>
                          <option value="neuropsychologist">Neuropsychologist</option>
                          <option value="social">Social Psychologist</option>
                          <option value="sports">Sports Psychologist</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="successfulCases" className={styles.label}>
                          Number of Successful Cases *
                        </label>
                        <Input
                          id="successfulCases"
                          name="successfulCases"
                          type="number"
                          placeholder="Approximate number of successful cases"
                          value={formData.successfulCases}
                          onChange={handleChange}
                          required
                          className={styles.input}
                        />
                        <p className={styles.helperText}>
                          Please provide an approximate number based on your professional experience
                        </p>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="dsmAwareness" className={styles.label}>
                          How aware are you of DSM and Therapy? Please provide a detailed written answer. *
                        </label>
                        <textarea
                          id="dsmAwareness"
                          name="dsmAwareness"
                          rows={6}
                          placeholder="Describe your knowledge and experience with DSM (Diagnostic and Statistical Manual of Mental Disorders) and various therapy approaches. Include details about your training, certifications, and practical experience."
                          value={formData.dsmAwareness}
                          onChange={handleChange}
                          required
                          className={styles.textarea}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="therapyTypes" className={styles.label}>
                          What kind of therapy do you want to provide here? Please provide detailed information. *
                        </label>
                        <textarea
                          id="therapyTypes"
                          name="therapyTypes"
                          rows={6}
                          placeholder="Describe the types of therapy you specialize in (e.g., CBT, DBT, EMDR, Psychodynamic, Humanistic, etc.). Include your approach, methodologies, and what makes your therapeutic style unique."
                          value={formData.therapyTypes}
                          onChange={handleChange}
                          required
                          className={styles.textarea}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="certificateImage" className={styles.label}>
                          Upload Your License/Certificate Image *
                        </label>
                        <div className={styles.fileUploadWrapper}>
                          <input
                            type="file"
                            id="certificateImage"
                            name="certificateImage"
                            accept="image/*,.pdf,application/pdf"
                            onChange={(e) => handleFileChange(e, "certificateImage")}
                            required
                            className={styles.fileInput}
                          />
                          <label htmlFor="certificateImage" className={styles.fileUploadLabel}>
                            <Upload className={styles.uploadIcon} />
                            {formData.certificateImage ? formData.certificateImage.name : "Choose certificate image"}
                          </label>
                        </div>
                        <p className={styles.helperText}>
                          Please upload a clear image of your professional license or certificate (JPG, PNG, PDF)
                        </p>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="degreeImage" className={styles.label}>
                          Upload Your College Degree Image *
                        </label>
                        <div className={styles.fileUploadWrapper}>
                          <input
                            type="file"
                            id="degreeImage"
                            name="degreeImage"
                            accept="image/*,.pdf,application/pdf"
                            onChange={(e) => handleFileChange(e, "degreeImage")}
                            required
                            className={styles.fileInput}
                          />
                          <label htmlFor="degreeImage" className={styles.fileUploadLabel}>
                            <Upload className={styles.uploadIcon} />
                            {formData.degreeImage ? formData.degreeImage.name : "Choose degree image"}
                          </label>
                        </div>
                        <p className={styles.helperText}>
                          Please upload a clear image of your college degree (JPG, PNG, PDF)
                        </p>
                      </div>

                      <div className={styles.disclaimerBox}>
                        <Shield className={styles.disclaimerIcon} />
                        <p className={styles.disclaimerText}>
                          Licensed professionals only • Application review required • 
                          We&apos;ll verify your credentials before approval • 
                          All information provided will be kept confidential
                        </p>
                      </div>

                      <div className={styles.buttonGroup}>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className={styles.backButton}
                          size="lg"
                          onClick={handleBack}
                        >
                          <ArrowRight className={styles.buttonIcon} style={{ transform: 'rotate(180deg)' }} />
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          variant="healing" 
                          className={styles.submitButton}
                          size="lg"
                          disabled={isLoading}
                        >
                          {isLoading ? "Submitting..." : "Submit Application"}
                          <ArrowRight className={styles.buttonIcon} />
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

