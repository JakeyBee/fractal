// GPU programs, written in GLSL (a small C-like language that runs on the graphics card).

// Vertex shader: places the corners of one big triangle that covers the screen.
export const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// Fragment shader: runs once for EVERY pixel, all at the same time.
// This is the same escape-time loop as before, moved onto the GPU.
export const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_resolution;     // canvas size in pixels
uniform vec2 u_center;         // view.cx, view.cy
uniform float u_unitsPerPixel; // view.scale / canvas height
uniform int u_maxIter;         // iteration budget, grows as you zoom in
uniform int u_fractal;         // 0 = Mandelbrot, 1 = Burning Ship, 2 = Julia
uniform vec2 u_juliaC;         // the fixed c used by the Julia set
uniform int u_classic;         // 1 = original purple colors, 0 = cosine palette below
uniform vec3 u_palA;           // cosine palette: color = a + b * cos(2pi * (c * t + d))
uniform vec3 u_palB;
uniform vec3 u_palC;
uniform vec3 u_palD;

// GLSL loops need a fixed limit, so loop up to the cap and stop early at u_maxIter
const int MAX_ITER_CAP = 2000;

void main() {
    // STEP 1: this pixel -> complex number c
    // (gl_FragCoord.y already points up, like the math y axis, so no minus sign here)
    vec2 c = u_center + (gl_FragCoord.xy - 0.5 * u_resolution) * u_unitsPerPixel;

    // STEP 2: escape-time loop. z.x = real part, z.y = imaginary part
    vec2 z = vec2(0.0);
    if (u_fractal == 1) {
        c.y = -c.y;     // Burning Ship: flip it so the "ship" sits upright
    } else if (u_fractal == 2) {
        z = c;          // Julia: start z at this pixel...
        c = u_juliaC;   // ...and use the same fixed c for every pixel
    }
    int n = u_maxIter;
    for (int i = 0; i < MAX_ITER_CAP; i++) {
        if (i >= u_maxIter) break;
        // Escape at |z| > 16 instead of 2. Same points escape, but the bigger radius
        // makes the smooth-color formula below accurate.
        if (dot(z, z) > 256.0) { n = i; break; }  // dot(z, z) = zr*zr + zi*zi
        if (u_fractal == 1) z = abs(z);  // Burning Ship: fold z into the positive quarter first
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }

    // STEP 3: color. Same formula as the CPU version, but colors are 0..1 instead of 0..255
    if (n == u_maxIter) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    // Smooth coloring: add a fraction based on how far past the edge z flew,
    // so neighbouring pixels blend instead of jumping from one band to the next.
    float smoothN = float(n) + 1.0 - log2(0.5 * log(dot(z, z)));
    if (u_classic == 1) {
        // Original purple colors
        float t = sqrt(clamp(smoothN / float(u_maxIter), 0.0, 1.0));
        gl_FragColor = vec4(t, (200.0 / 255.0) * t, (80.0 + 175.0 * t) / 255.0, 1.0);
    } else {
        // Cosine palette: colors cycle as smoothN grows, so deep zooms stay colorful
        float t = smoothN * 0.025;
        vec3 color = u_palA + u_palB * cos(6.28318 * (u_palC * t + u_palD));
        gl_FragColor = vec4(color, 1.0);
    }
}
`;