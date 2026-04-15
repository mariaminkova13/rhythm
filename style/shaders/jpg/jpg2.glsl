#ifdef FRAGMENT_SHADER
uniform vec3 iResolution
#define STEPS (2.0)
vec3 dct_v(vec2 fc)
{
    vec2 grid = floor(fc/8.)*8.;
    vec2 uv = fract(fc/8.)*8.;
    
    vec3 s = vec3(0);
    for (int y=0; y<8; y++)
    {
        vec3 c = texture(iChannel0, (grid+vec2(floor(uv.x),y)+.5)/iResolution.xy).rgb;
        s += c*mdct[int(uv.y)*8+y]; //cos(PI*uv.y*(y+.5)/8.);
    }
    return s;
}

void main()
{
    vec3 col = dct_v(gl_fragCoord)*.25;
    col = round(col*STEPS)/STEPS;
    gl_fragColor = vec4(col,1.);
}
#endif