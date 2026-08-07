import { Footer } from "@/components/layout/footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Analytics } from "@vercel/analytics/next"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <Footer />
      <Analytics />
    </div>
  );
}
