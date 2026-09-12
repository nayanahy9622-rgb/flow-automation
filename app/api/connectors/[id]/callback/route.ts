import {NextRequest, NextResponse} from "next/server";
import {getProvider, completeOAuth} from "@/lib/oauth";
import {timingSafeEqual} from "crypto";

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(req: NextRequest, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const p = getProvider(id);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const saved = req.cookies.get("flowos_oauth_state")?.value;

  if (error) {
    return NextResponse.redirect(new URL("/?connector_error=" + encodeURIComponent(error), process.env.APP_URL || req.url));
  }
  if (!p || p.mode !== "oauth" || !code || !state || !saved || !equal(state, saved)) {
    return new NextResponse("Invalid OAuth callback", {status: 403});
  }

  try {
    await completeOAuth(id, code);
  } catch {
    return NextResponse.redirect(new URL("/?connector_error=" + encodeURIComponent(id), process.env.APP_URL || req.url));
  }

  const target = id === "gmail" ? "/?connected=gmail" : "/?connected=" + encodeURIComponent(id);
  const redirect = NextResponse.redirect(new URL(target, process.env.APP_URL || req.url));
  redirect.cookies.set("flowos_oauth_state", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return redirect;
}
