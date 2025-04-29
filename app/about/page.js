/**
 * About page for AdVision v1.0.
 */
export default function About() {
    return (
      <div className="container mx-auto py-section px-4 min-h-[calc(100vh-8rem)] flex items-center">
        <div className="max-w-3xl mx-auto text-center bg-apple-white rounded-apple p-element fade-in w-full sm:w-3/4 md:w-1/2">
          <h1 className="text-hero font-medium text-apple-black tracking-tight mb-6 text-2xl sm:text-3xl md:text-hero">
            About AdVision
          </h1>
          <p className="text-body text-apple-gray leading-relaxed text-base sm:text-lg">
            AdVision empowers businesses with AI-driven insights to optimize projects and achieve impactful results.
          </p>
        </div>
      </div>
    );
  }