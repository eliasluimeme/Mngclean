// import type { Metadata } from "next";
// import localFont from "next/font/local";
// import "./globals.css";
// import WhatsAppButton from "@/components/WhatsAppWidget";
// import { Analytics } from "@vercel/analytics/react";

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

// export const metadata: Metadata = {
//   title: "Mng Clean",
//   description: "Professional cleaning services",
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <head>
//         <script
//           dangerouslySetInnerHTML={{
//             __html: `
//               !function(f,b,e,v,n,t,s)
//               {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
//               n.callMethod.apply(n,arguments):n.queue.push(arguments)};
//               if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
//               n.queue=[];t=b.createElement(e);t.async=!0;
//               t.src=v;s=b.getElementsByTagName(e)[0];
//               s.parentNode.insertBefore(t,s)}(window, document,'script',
//               'https://connect.facebook.net/en_US/fbevents.js');
//               fbq('init', '4029335224002478');
//               fbq('track', 'PageView');
//             `,
//           }}
//           async
//         />
//       </head>
//       <body
//         className={`${geistSans.variable} ${geistMono.variable} antialiased`}
//         suppressHydrationWarning
//       >
//         {children}
//         <WhatsAppButton />
//         <Analytics />
//       </body>
//     </html>
//   );
// }

import type React from "react"
import "./global.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { SidebarStateProvider } from "@/hooks/use-sidebar-state"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SidebarStateProvider>
              {children}
            </SidebarStateProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

