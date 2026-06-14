import { Button } from "@/components/ui/button";
import { TrendingUp, ShieldCheck, Zap, Globe, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0B0E11] text-[#EAECEF]">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 px-4 lg:px-6 h-20 flex items-center bg-[#0B0E11]/80 backdrop-blur-md border-b border-[#2B3139]">
        <div className="container mx-auto flex items-center justify-between">
          <Link className="flex items-center justify-center gap-2" href="/">
                           <img
  src="/icons/logo.png"
  alt="SettlerPay"
  className="h-8 sm:h-10 md:h-11 lg:h-12 w-auto object-contain"
/>
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link className="text-sm font-medium text-[#848E9C] hover:text-primary transition-colors" href="#features">
              Features
            </Link>
            <Link className="text-sm font-medium text-[#848E9C] hover:text-primary transition-colors" href="/login">
              Rates
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link className="hidden sm:block text-sm font-medium hover:text-primary transition-colors" href="/login">
              Login
            </Link>
            {/* <Button asChild size="sm" className="rounded-xl px-6 font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              <Link href="/register">Get Started</Link>
            </Button> */}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden w-full py-24 md:py-36 lg:py-52">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-[#0B0E11] to-[#0B0E11] -z-10" />
          <div className="container px-4 md:px-6 mx-auto relative">
            <div className="flex flex-col items-center space-y-10 text-center">
              <div className="inline-flex items-center rounded-full border border-primary/20 px-4 py-1.5 text-xs font-bold bg-primary/10 text-primary backdrop-blur-sm mb-4 tracking-wider uppercase">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
                Trusted by 50,000+ Active Users
              </div>
              <div className="space-y-6 max-w-5xl">
                <h1 className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1] text-white">
                  Buy & Exchange <br />
                  <span className="text-primary">Digital Assets</span> Fast
                </h1>
                <p className="mx-auto max-w-[800px] text-[#848E9C] text-lg md:text-2xl leading-relaxed font-medium">
                  The world&apos;s leading platform for Cash App USD to USDT exchange and instant gaming topups. Secure, transparent, and built for you.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto pt-4">
                {/* <Button asChild size="lg" className="rounded-2xl px-10 text-lg h-16 font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"> */}
                  {/* <Link href="/register">
                    Start Exchanging <ArrowRight className="ml-2 h-6 w-6" />
                  </Link> */}
                {/* </Button> */}
                <Button variant="outline" size="lg" className="rounded-2xl px-10 text-lg h-16 font-bold border-2 border-[#2B3139] bg-transparent hover:bg-[#1E2329] text-white transition-all" asChild>
                  <Link href="/login">View Live Rates</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-28 bg-[#1E2329]/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl text-white">Fintech Excellence</h2>
              <p className="text-[#848E9C] text-xl max-w-[650px] mx-auto font-medium">
                Experience the next generation of digital currency management with our robust features.
              </p>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Most transactions are processed and delivered in under 10 minutes of verification."
                },
                {
                  icon: ShieldCheck,
                  title: "Military-Grade Security",
                  description: "We use state-of-the-art encryption and manual verification to keep your funds safe."
                },
                {
                  icon: Globe,
                  title: "Game Integration",
                  description: "Direct API integration with popular gaming platforms for instant credit delivery."
                }
              ].map((feature, i) => (
                <div key={i} className="group relative flex flex-col p-8 rounded-3xl border bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="w-full py-28">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-10">
                <h2 className="text-4xl font-black tracking-tight sm:text-5xl text-white leading-tight">Start Trading in <br />3 Simple Steps</h2>
                <div className="space-y-8">
                  {[
                    { step: "01", title: "Create your Account", desc: "Sign up in minutes with just your email and a secure password." },
                    { step: "02", title: "Choose your Asset", desc: "Select USD to USDT or pick from our wide range of gaming credits." },
                    { step: "03", title: "Secure Payment", desc: "Pay via Cash App and upload your proof for instant verification." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="text-5xl font-black text-primary/10 group-hover:text-primary/20 transition-colors duration-300">{item.step}</div>
                      <div>
                        <h4 className="text-2xl font-bold mb-2 text-white">{item.title}</h4>
                        <p className="text-[#848E9C] text-lg font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-10 bg-primary/20 blur-[100px] rounded-full -z-10 animate-pulse" />
                <div className="rounded-[3rem] border border-[#2B3139] bg-[#1E2329] p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <TrendingUp className="h-40 w-40" />
                  </div>
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between pb-6 border-b border-[#2B3139]">
                      <span className="font-black text-xl text-white">Live Market Rates</span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#0ECB81] bg-[#0ECB81]/10 px-3 py-1 rounded-full">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-[#0ECB81] animate-ping" />
                        Live
                      </span>
                    </div>
                    {[
                      { pair: "USD → USDT", rate: "0.95", change: "+0.2%" },
                      { pair: "USDT → USD", rate: "1.05", change: "-0.1%" },
                      { pair: "Juwa Credit", rate: "1.00", change: "0.0%" },
                      { pair: "Firekirin Credit", rate: "1.00", change: "0.0%" }
                    ].map((r, i) => (
                      <div key={i} className="flex items-center justify-between py-3">
                        <span className="text-lg font-bold text-[#848E9C]">{r.pair}</span>
                        <div className="text-right">
                          <div className="text-lg font-black text-white">${r.rate}</div>
                          <div className="text-[10px] font-black text-[#0ECB81]">{r.change}</div>
                        </div>
                      </div>
                    ))}
                    {/* <Button className="w-full mt-6 rounded-2xl h-14 font-black text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/10" asChild>
                      <Link href="/register">Start Now</Link>
                    </Button> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2B3139] bg-[#0B0E11]">
        <div className="container px-4 md:px-6 py-16 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <Link className="flex items-center gap-2" href="/">
                {/* <div className="bg-primary p-1.5 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div> */}
                {/* <span className="font-black text-2xl text-white">Settlerpay</span>
                 */}
                 <img
                    src="/icons/logo.png"
                    alt="SettlerPay"
                    className="h-8 sm:h-10 md:h-11 lg:h-12 w-auto object-contain"
                  />
              </Link>
              <p className="text-[#848E9C] text-lg max-w-sm font-medium">
                The most trusted digital asset exchange for Cash App users and gaming enthusiasts worldwide.
              </p>
            </div>
            <div className="space-y-6">
              <h4 className="font-black text-white text-lg uppercase tracking-wider">Platform</h4>
              <nav className="flex flex-col gap-4">
                <Link className="text-[#848E9C] hover:text-primary transition-colors font-medium" href="/login">Exchange</Link>
                <Link className="text-[#848E9C] hover:text-primary transition-colors font-medium" href="/login">Gaming Topup</Link>
                <Link className="text-[#848E9C] hover:text-primary transition-colors font-medium" href="/login">Market Rates</Link>
              </nav>
            </div>
            <div className="space-y-6">
              <h4 className="font-black text-white text-lg uppercase tracking-wider">Support</h4>
              <nav className="flex flex-col gap-4">
                <Link className="text-[#848E9C] hover:text-primary transition-colors font-medium" href="#">Help Center</Link>
                <Link className="text-[#848E9C] hover:text-primary transition-colors font-medium" href="#">Terms of Use</Link>
                <Link className="text-[#848E9C] hover:text-primary transition-colors font-medium" href="#">Privacy Policy</Link>
              </nav>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-[#2B3139] flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-[#848E9C] text-sm font-medium">
              © 2026 Settlerpay Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
