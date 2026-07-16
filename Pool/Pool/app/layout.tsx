import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans=Geist({variable:"--font-geist-sans",subsets:["latin"]});
const geistMono=Geist_Mono({variable:"--font-geist-mono",subsets:["latin"]});
export async function generateMetadata():Promise<Metadata>{
  const h=await headers();
  const host=h.get("x-forwarded-host")||h.get("host")||"localhost:3003";
  const protocol=h.get("x-forwarded-proto")||(/localhost/.test(host)?"http":"https");
  const image=protocol+"://"+host+"/og.png";
  return {
    title:"Happy Break! — Cartoon Pool",
    description:"A cheerful, playable 3D-style HTML5 pool game.",
    icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"},
    openGraph:{title:"Happy Break! — Cartoon Pool",description:"Aim, shoot, and clear the table in this cheerful 3D-style pool game.",images:[{url:image,width:1536,height:878,alt:"Happy Break cartoon pool game"}]},
    twitter:{card:"summary_large_image",title:"Happy Break! — Cartoon Pool",description:"A cheerful, playable 3D-style HTML5 pool game.",images:[image]}
  };
}
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){
  return <html lang="en"><body className={geistSans.variable+" "+geistMono.variable}>{children}</body></html>
}
