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
uniform vec3 u_vignetteColor;
uniform vec3 u_red;

// Vignette settings
const float vignetteIntensity = 21.0; //higher is stronger
const float vignetteExtent = 0.18; //higher is farther
uniform float u_vignetteRedness;

void main() {
    //vec3 pct = vec3(u_vignetteRedness);
    float pct = u_vignetteRedness;
    vec3 color = mix(u_vignetteColor, u_red, pct);
    //vec3 color = u_red;

    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv *=  1.0 - uv.yx;
    float vig = uv.x*uv.y * vignetteIntensity;
    vig = pow(vig, vignetteExtent);

    // Vignette: center bright (transparent), edges dark (opaque)
    // Alpha should be higher at edges, lower at center
    
    // different blend mode where as if vignette is layered on top- dark red on grey should no become pink

    float alpha = 1.0 - vig;
    gl_FragColor = vec4(color, alpha);
}

#endif