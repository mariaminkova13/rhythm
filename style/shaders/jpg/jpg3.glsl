#ifdef FRAGMENT_SHADER
uniform vec3 iResolution
vec3 idct_h(vec2 fc)
{
    vec2 grid = floor(fc/8.)*8.;
    vec2 xy = fract(fc/8.)*8.;
    vec3 s = vec3(0.);
    
    for (int u=0; u<8; u++)
    {
        vec3 c = texture(iChannel0, (grid+vec2(u, xy.y-.5)+.5)/iResolution.xy).rgb;
        s += c*mdct[u*8+int(xy.x)]; //*cos(PI*(xy.x+.5)/8.*u);
    }
    
    return s;
}

void main()
{
    gl_fragColor = vec4(idct_h(gl_fragCoord),1.0);
}
#endif