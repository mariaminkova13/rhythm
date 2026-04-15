#ifdef FRAGMENT_SHADER
uniform vec3 iResolution
void main()
{
    gl_fragColor = texture(iChannel0, gl_fragCoord/iResolution.xy);
}
#endif