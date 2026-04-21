document.addEventListener('DOMContentLoaded', async () => {
     const canvas = document.getElementById('jpg-canvas')
     const gl = canvas.getContext('webgl');

     // Fragment shader that implements jpeg compression emulation
     const fragmentShaderSrc = await (await fetch('style/shaders/jpg/jpg.glsl')).text();

     // Vertex shader: positions a fullscreen quad and converts clip-space coords (-1..1)
     // to UV coords (0..1) so the fragment shader can sample the texture correctly
     const vertexShaderSrc = `attribute vec2 aPosition;
     varying vec2 vUv;

     void main() {
         vUv = (aPosition + 1.0) * 0.5;
         gl_Position = vec4(aPosition, 0.0, 1.0);
     }`

     // Compile a shader from source — upload GLSL to the GPU and compile it
     async function compileShader(source, type) {
          const shader = gl.createShader(type);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
               console.error("Shader compile error:", gl.getShaderInfoLog(shader));
          }
          return shader;
     }

     const fragmentShader = await compileShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);
     const vertexShader = await compileShader(vertexShaderSrc, gl.VERTEX_SHADER);

     // Link the two shaders into a GPU program
     const program = gl.createProgram();
     gl.attachShader(program, fragmentShader);
     gl.attachShader(program, vertexShader);
     gl.linkProgram(program);
     gl.useProgram(program);

     gl.uniform1f(gl.getUniformLocation(program, "uQuality"), 0.1); // Setting the jpeg quality from 0.001 (lowest) to 0.1 (best). TODO make bit depth number
     gl.uniform1f(gl.getUniformLocation(program, "uBlockSize"), 1.0); // set the size of a block TODO make it the value in pixels

     // Two triangles cover the entire space (-1..1), so the shader runs on every pixel of the canvas
     const vertices = new Float32Array([
          -1, -1,
          1, -1,
          -1, 1,
          -1, 1,
          1, -1,
          1, 1
     ]);

     const buffer = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
     gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

     // find the pixel position
     const posLoc = gl.getAttribLocation(program, "aPosition");
     gl.enableVertexAttribArray(posLoc);
     gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

     // Fetch the background image and decode it into a GPU-ready bitmap TODO make it real-time on everything onscreen including text
     const imgBlob = await (await fetch('markup/covers/windowsdarkmode.jpg')).blob();
     const img = await createImageBitmap(imgBlob, { imageOrientation: 'flipY' });

     // Upload the bitmap to a WebGL texture
     const sceneTex = gl.createTexture();
     gl.bindTexture(gl.TEXTURE_2D, sceneTex);
     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

     // CLAMP_TO_EDGE is required for non-power-of-two images in WebGL1
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

     gl.viewport(0, 0, canvas.width, canvas.height);

     // Bind the texture to unit 0 and pass it to the fragment shader as uTex
     gl.activeTexture(gl.TEXTURE0);
     gl.bindTexture(gl.TEXTURE_2D, sceneTex);
     gl.uniform1i(
          gl.getUniformLocation(program, "uTex"),
          0
     );

     // Pass canvas dimensions so the shader can compute pixel-accurate block sizes
     gl.uniform2f(
          gl.getUniformLocation(program, "uResolution"),
          canvas.width,
          canvas.height
     );

     // Draw the fullscreen quad — this triggers the fragment shader on every pixel
     // drawing all 6 vertices from index 0
     gl.drawArrays(gl.TRIANGLES, 0, 6);
})
