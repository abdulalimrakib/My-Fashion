/**
 * Upload validation. The point of `sniffImage` is that it reads the file's own
 * bytes, so these assertions use real image files from the repository rather
 * than fixtures with a declared MIME type.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  FALLBACK_BLUR_DATA_URL,
  MAX_IMAGE_BYTES,
  MIN_IMAGE_DIMENSION,
  imageAssetUrl,
  isValidBlurDataUrl,
  sniffImage,
  validateImageBytes,
} from "../lib/images";
import { DRESS_STYLE_IMAGES } from "../lib/constants";

const png = new Uint8Array(readFileSync("public/images/products/t-shirt-with-tape-details.png"));
const jpeg = new Uint8Array(readFileSync("public/images/casual.jpeg"));
const webp = new Uint8Array(
  Buffer.from(DRESS_STYLE_IMAGES.casual.blurDataURL.split(",")[1], "base64"),
);

describe("sniffImage", () => {
  it("reads the real type and dimensions of a PNG", () => {
    assert.deepEqual(sniffImage(png), { mimeType: "image/png", width: 300, height: 300 });
  });

  it("reads the real type and dimensions of a JPEG", () => {
    const result = sniffImage(jpeg);
    assert.equal(result?.mimeType, "image/jpeg");
    assert.ok((result?.width ?? 0) > 0 && (result?.height ?? 0) > 0);
  });

  it("reads the real type and dimensions of a WebP", () => {
    const result = sniffImage(webp);
    assert.equal(result?.mimeType, "image/webp");
    assert.equal(result?.width, 16);
    assert.equal(result?.height, 16);
  });

  it("rejects a file that is not an image, whatever it is named", () => {
    assert.equal(sniffImage(new Uint8Array(Buffer.from("#!/bin/sh\nrm -rf /\n"))), null);
  });

  it("rejects a PNG signature with no valid header behind it", () => {
    const truncated = png.slice(0, 12);
    assert.equal(sniffImage(truncated), null);
  });
});

describe("validateImageBytes", () => {
  it("accepts a real product photograph", () => {
    const result = validateImageBytes(png);
    assert.equal(result.ok, true);
  });

  it("rejects an empty file", () => {
    const result = validateImageBytes(new Uint8Array(0));
    assert.equal(result.ok, false);
    assert.match(result.ok === false ? result.error.message : "", /empty/i);
  });

  it("rejects a file over the size limit before parsing it", () => {
    const oversized = new Uint8Array(MAX_IMAGE_BYTES + 1);
    oversized.set(png.slice(0, 64));
    const result = validateImageBytes(oversized);
    assert.equal(result.ok, false);
    assert.match(result.ok === false ? result.error.message : "", /limit is/i);
  });

  it("rejects an image smaller than the minimum dimension", () => {
    const result = validateImageBytes(webp);
    assert.equal(result.ok, false);
    assert.match(
      result.ok === false ? result.error.message : "",
      new RegExp(`${MIN_IMAGE_DIMENSION}`),
    );
  });

  it("rejects an executable renamed with an image extension", () => {
    const result = validateImageBytes(new Uint8Array(Buffer.from("MZ\x90\x00\x03\x00\x00\x00")));
    assert.equal(result.ok, false);
    assert.match(result.ok === false ? result.error.message : "", /not a valid image/i);
  });
});

describe("isValidBlurDataUrl", () => {
  it("accepts the data URLs the browser produces", () => {
    assert.equal(isValidBlurDataUrl(DRESS_STYLE_IMAGES.casual.blurDataURL), true);
    assert.equal(isValidBlurDataUrl(FALLBACK_BLUR_DATA_URL), true);
  });

  it("rejects anything that is not a base64 image data URL", () => {
    assert.equal(isValidBlurDataUrl("https://example.com/evil.png"), false);
    assert.equal(isValidBlurDataUrl("data:text/html;base64,PHNjcmlwdD4="), false);
    assert.equal(isValidBlurDataUrl(`data:image/png;base64,${"A".repeat(5000)}`), false);
  });
});

describe("imageAssetUrl", () => {
  it("points at the route that serves stored bytes", () => {
    assert.equal(imageAssetUrl("abc123"), "/api/images/abc123");
  });
});
