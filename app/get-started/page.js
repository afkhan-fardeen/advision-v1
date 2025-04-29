/**
 * Get Started page for AdVision v1.0.
 */
import Link from 'next/link';

export default function GetStarted() {
    return (
      <div className="container mx-auto py-section px-4 min-h-[calc(100vh-8rem)] flex items-center">
        <div className="max-w-3xl mx-auto text-center bg-apple-white rounded-apple p-element fade-in w-full sm:w-3/4 md:w-1/2">
          <h1 className="text-hero font-medium text-apple-black tracking-tight mb-6 text-2xl sm:text-3xl md:text-hero">
            Get Started with AdVision
          </h1>
          <p className="text-body text-apple-gray leading-relaxed text-base sm:text-lg">
            Begin leveraging AdVision’s AI tools for smarter project outcomes. (Onboarding flow coming soon.)
          </p>
          <Link
            href="/"
            className="gradient-button inline-block mt-6 px-8 py-3 text-apple-black text-small font-medium rounded-apple transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }