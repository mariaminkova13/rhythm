// Vertex Shader
#ifdef VERTEX_SHADER
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
#endif

// Fragment Shader
#ifdef FRAGMENT_SHADER
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;

// Vignette settings
const float vignetteIntensity = 8.5;
const float vignetteExtent = 0.18; //higher is farther
const vec3 vignetteColor = vec3(0.0/255.0, 0.0/255.0, 0.0/255.0);
// const vec3 vignetteColor = vec3(47.0/255.0, 79.0/255.0, 79.0/255.0);

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv *=  1.0 - uv.yx;
    float vig = uv.x*uv.y * vignetteIntensity;
    vig = pow(vig, vignetteExtent);

    // Vignette: center bright (transparent), edges dark (opaque)
    // Alpha should be higher at edges, lower at center
    float alpha = 1.0 - vig;
    gl_FragColor = vec4(vignetteColor, alpha);
}

#endif