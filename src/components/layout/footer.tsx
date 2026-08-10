import * as React from "react";

import Link from "next/link";

import { Mail } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { GithubIcon } from "@/components/brand/icons";
import { marketingNav } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:py-16 sm:px-6">
         <div className="flex flex-wrap gap-8 sm:gap-10">
           <div className="w-64 flex-shrink-0 mr-auto">
             <Logo />
             <p className="mt-4 max-w-sm text-sm text-muted-foreground">
               Phonq is a free, open-source music streaming platform for the phonk community. Every
               track is Creative Commons licensed and streamed legally via the Jamendo API.
             </p>
             <div className="mt-5 flex items-center gap-2">
               <a
                 href="https://github.com/hexsyro/Phonq"
                 target="_blank"
                 rel="noreferrer"
                 className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                 aria-label="GitHub"
               >
                 <GithubIcon className="size-5" />
               </a>
               <a
                 href="mailto:hello@phonq.app"
                 className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                 aria-label="Email"
               >
                 <Mail className="size-5" />
               </a>
             </div>
           </div>

           {marketingNav.map((group) => (
             <div key={group.label} className="flex min-w-[140px] flex-col">
               <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{group.label}</p>
               <ul className="space-y-2">
                 {group.items.map((item) => (
                   <li key={item.href}>
                     <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                       {item.label}
                     </Link>
                   </li>
                 ))}
               </ul>
             </div>
           ))}
         </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Phonq. Music by independent artists via{" "}
            <a href="https://www.jamendo.com" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
              Jamendo
            </a>{" "}
            (CC-licensed). Built with Next.js and Neon.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
