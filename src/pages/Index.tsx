import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { DropsSection } from "@/components/DropsSection";
import { CategorySection } from "@/components/CategorySection";
import { NewsletterSection } from "@/components/NewsletterSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <DropsSection />
        <CategorySection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
