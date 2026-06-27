import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const THERAPIST_PREFIX = "/therapist-dashboard";
const PATIENT_PREFIX = "/patient-dashboard";
const RECEPTION_PREFIX = "/reception-dashboard";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(THERAPIST_PREFIX) && pathname !== "/therapist-signin") {
    const hasSession = request.cookies.get("therapist_session")?.value;
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/therapist-signin";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith(PATIENT_PREFIX)) {
    const hasSession = request.cookies.get("patient_session")?.value;
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith(RECEPTION_PREFIX)) {
    const hasSession = request.cookies.get("receptionist_session")?.value;
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/reception-signin";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/therapist-dashboard/:path*", "/patient-dashboard/:path*", "/reception-dashboard/:path*"],
};
