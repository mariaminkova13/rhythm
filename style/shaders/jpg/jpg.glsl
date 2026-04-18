precision mediump float;
varying vec2 vUv;
void main() {
    gl_FragColor = vec4(vUv, 0.0, 1.0); // simple gradient
}

// // #version 300 es
// precision highp float;

// uniform sampler2D uTex;
// uniform vec2 uResolution;
// uniform float uQuality; // 0.0 (worst) to 1.0 (best)

// varying vec2 vUv;

// // RGB <-> YCbCr helpers
// vec3 rgb2ycbcr(vec3 c) {
//     float Y  =  0.299*c.r + 0.587*c.g + 0.114*c.b;
//     float Cb = -0.168736*c.r - 0.331264*c.g + 0.5*c.b + 0.5;
//     float Cr =  0.5*c.r - 0.418688*c.g - 0.081312*c.b + 0.5;
//     return vec3(Y, Cb, Cr);
// }

// vec3 ycbcr2rgb(vec3 c) {
//     float Y  = c.x;
//     float Cb = c.y - 0.5;
//     float Cr = c.z - 0.5;
//     float R = Y + 1.402 * Cr;
//     float G = Y - 0.344136 * Cb - 0.714136 * Cr;
//     float B = Y + 1.772 * Cb;
//     return vec3(R, G, B);
// }

// // simple quantization
// float quantize(float v, float steps) {
//     return floor(v * steps) / steps;
// }

// void main() {
//     // --- 1. Block coordinates (simulate 8x8 JPEG blocks) ---
//     float blockSize = 8.0;
//     vec2 pixelCoord = vUv * uResolution;
//     vec2 blockCoord = floor(pixelCoord / blockSize) * blockSize;
//     vec2 blockUv = (blockCoord + vec2(0.5)) / uResolution;

//     // --- 2. Sample original color at block center ---
//     vec3 color = texture2D(uTex, blockUv).rgb;

//     // --- 3. Convert to YCbCr ---
//     vec3 ycc = rgb2ycbcr(color);

//     // --- 4. Quality-dependent quantization ---
//     // Map quality 0–1 to coarser/finer steps
//     float q = clamp(uQuality, 0.001, 1.0);
//     float ySteps  = mix(8.0, 256.0, q);   // luminance
//     float cSteps  = mix(4.0, 256.0, q);   // chroma

//     ycc.x = quantize(ycc.x, ySteps);
//     ycc.y = quantize(ycc.y, cSteps);
//     ycc.z = quantize(ycc.z, cSteps);

//     // --- 5. Optional chroma subsampling (4:2:0-ish) ---
//     float chromaBlockSize = blockSize * 2.0; // lower-res chroma
//     vec2 chromaBlockCoord = floor(pixelCoord / chromaBlockSize) * chromaBlockSize;
//     vec2 chromaUv = (chromaBlockCoord + vec2(0.5)) / uResolution;
//     vec3 chromaSample = rgb2ycbcr(texture2D(uTex, chromaUv).rgb);

//     // mix original Y with low-res CbCr
//     ycc.yz = mix(ycc.yz, chromaSample.yz, 0.7);

//     // --- 6. Back to RGB ---
//     vec3 finalColor = ycbcr2rgb(ycc);

//     // --- 7. Optional: emphasize block edges ---
//     vec2 blockIndex = floor(pixelCoord / blockSize);
//     vec2 blockFrac  = fract(pixelCoord / blockSize);
//     float edge = step(blockFrac.x, 0.02) + step(0.98, blockFrac.x)
//                + step(blockFrac.y, 0.02) + step(0.98, blockFrac.y);
//     edge = clamp(edge, 0.0, 1.0);
//     finalColor = mix(finalColor, finalColor * 0.8, edge * 0.2);

//     gl_FragColor = vec4(finalColor, 1.0);
// }