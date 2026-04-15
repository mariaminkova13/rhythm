#ifdef FRAGMENT_SHADER
uniform vec3 iResolution

//float a(float x){return (x<.5)?SQRT2:1.;}
//float dc(vec2 a, vec2 b) {return cos(PI*a.x*b.x)*cos(PI*a.y*b.y);}


vec3 dct_h(vec2 fc)
{
    vec2 grid = floor(fc/8.)*8.;
    vec2 uv = fract(fc/8.)*8.;
    
    vec3 s = vec3(0);
    for (int x=0; x<8; x++)
    {
        vec3 c = texture(iChannel0, (grid+vec2(x,floor(uv.y))+.5)/iResolution.xy).rgb;
        s += c*mdct[int(uv.x)*8+x]; //cos(PI*uv.x*(x+.5)/8.);
    }
    return s;
}

void mainImage( out vec4 gl_fragColor, in vec2 gl_fragCoord )
{
    gl_fragColor = vec4(dct_h(gl_fragCoord),1.0);
}
#endif