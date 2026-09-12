import { prisma } from "@/lib/prisma";

/**
 * Serves an image uploaded through the admin.
 *
 * Product photographs are public, so this is not behind the admin guard — it is
 * the same content the storefront renders. An asset's bytes never change once
 * written and its id is unguessable, so the response is immutable and can be
 * cached indefinitely; replacing a variant's image mints a new id.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/images/[id]">) {
  const { id } = await ctx.params;

  const asset = await prisma.imageAsset.findUnique({
    where: { id },
    select: { bytes: true, mimeType: true, byteSize: true },
  });

  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(asset.bytes), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.byteSize),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
