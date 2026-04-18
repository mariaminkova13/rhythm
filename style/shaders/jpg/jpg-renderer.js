document.addEventListener('DOMContentLoaded', async () => {
     const canvas = document.getElementById('jpg-canvas')
     const gl = canvas.getContext('webgl');
     const fragmentShaderSrc = await (await fetch('style/shaders/jpg/fragment-shader.glsl')).text()
     const vertexShaderSrc = await (await fetch('style/shaders/jpg/vertex-shader.glsl')).text()

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

     const program = gl.createProgram();
     gl.attachShader(program, fragmentShader);
     gl.attachShader(program, vertexShader);
     gl.linkProgram(program);

     const vertices = new Float32Array([
          -1, -1,
          1, -1,
          -1, 1,
          -1, 1,
          1, -1,
          1, 1
     ]);

     ////////////////////////////

     const buffer = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
     gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

     // Look up attribute location
     const posLoc = gl.getAttribLocation(program, "aPosition");
     gl.enableVertexAttribArray(posLoc);
     gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

     const sceneTex = gl.createTexture();
     gl.bindTexture(gl.TEXTURE_2D, sceneTex);
     gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          canvas.width,
          canvas.height,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null
     );
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

     const fbo = gl.createFramebuffer();
     gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
     gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          sceneTex,
          0
     );

     gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
     gl.viewport(0, 0, canvas.width, canvas.height);

     gl.bindFramebuffer(gl.FRAMEBUFFER, null); // back to screen
     gl.viewport(0, 0, canvas.width, canvas.height);

     gl.useProgram(program);

     // bind the scene texture to unit 0
     gl.activeTexture(gl.TEXTURE0);
     gl.bindTexture(gl.TEXTURE_2D, sceneTex);
     gl.uniform1i(gl.getUniformLocation(program, "uTex"), 0);

     // set resolution to the texture resolution
     gl.uniform2f(
          gl.getUniformLocation(program, "uResolution"),
          canvas.width,
          canvas.height
     );

     // draw fullscreen quad
     gl.drawArrays(gl.TRIANGLES, 0, 6);
})