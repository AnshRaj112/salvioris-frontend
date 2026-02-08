"use client";

import { useState } from "react";
import {
    CheckCircle,
    Mail,
    CheckCircle2,
  } from "lucide-react";
  import { Button } from "../ui/button";
  import { Card, CardContent, CardHeader, CardTitle} from "../ui/card";
  import { api, ApiError } from "../../lib/api";

export default function ContactUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Please provide your name");
      return;
    }

    if (!email.trim()) {
      setError("Please provide your email");
      return;
    }

    if (!message.trim()) {
      setError("Please provide a message");
      return;
    }

    if (message.trim().length < 10) {
      setError("Please provide a more detailed message (at least 10 characters)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.submitContact({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });

      if (response.success) {
        setIsSubmitted(true);
        setName("");
        setEmail("");
        setMessage("");
        // Reset success message after 5 seconds
        setTimeout(() => {
          setIsSubmitted(false);
        }, 5000);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to submit contact form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

    return (
<section className="py-20 bg-[#1d2935] w-full">
<div className="w-full px-4 sm:px-6 lg:px-8">
  <div className="grid lg:grid-cols-2 gap-12 items-center">
    <div>
      <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-6">
        Ready to Start Your Healing Journey?
      </h2>
      <p className="text-lg text-muted-foreground mb-8">
        Our support team is here to help you find the perfect therapist match. 
        Reach out with any questions or concerns.
      </p>
      
      <div className="space-y-4 mb-8">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-primary" />
          <span className="text-foreground">Free therapist matching</span>
        </div>
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-primary" />
          <span className="text-foreground">No commitment required</span>
        </div>
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-primary" />
          <span className="text-foreground">Support available 24/7</span>
        </div>
      </div>

      <Button variant="healing" size="lg">
        <Mail className="w-5 h-5" />
        Get Started Today
      </Button>
    </div>

    <Card className="bg-card/50 backdrop-blur-sm border-border shadow-warm">
      <CardHeader>
        <CardTitle className="font-display text-foreground">Contact Us</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Message Sent!</h3>
            <p className="text-sm text-muted-foreground">
              Thank you for contacting us. We&apos;ll get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Message <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground resize-none"
                placeholder="How can we help you?"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 10 characters
              </p>
            </div>
            <Button 
              variant="healing" 
              className="w-full"
              type="submit"
              disabled={isSubmitting || !name.trim() || !email.trim() || !message.trim()}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  </div>
</div>
</section>
    )
}
