import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const data = await request.formData();
  const entered = data.get("password")?.toString() ?? "";
  const password = import.meta.env.SITE_PASSWORD ?? "Time-Turner";

  if (entered === password) {
    cookies.set("site-auth", password, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: false }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
};
