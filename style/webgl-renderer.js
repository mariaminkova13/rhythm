// WebGL Renderer with Shader Support

class WebGLRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }

        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');

        if (!this.gl) {
            alert("Unable to initialize WebGL. Your browser may not support it.");
            return;
        }

        this.program = null;
        this.startTime = Date.now();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    async loadShader(url) {
        const response = await fetch(url);
        const shaderSource = await response.text();
        return shaderSource;
    }

    compileShader(source, type, define) {
        const shader = this.gl.createShader(type);
        const finalSource = `#define ${define}\n${source}`;
        this.gl.shaderSource(shader, finalSource);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    async initShaders(shaderPath) {
        const shaderSource = await this.loadShader(shaderPath);

        const vertexShader = this.compileShader(
            shaderSource,
            this.gl.VERTEX_SHADER,
            'VERTEX_SHADER'
        );

        const fragmentShader = this.compileShader(
            shaderSource,
            this.gl.FRAGMENT_SHADER,
            'FRAGMENT_SHADER'
        );

        if (!vertexShader || !fragmentShader) {
            console.error('Failed to compile shaders');
            return false;
        }

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(this.program));
            return false;
        }

        this.gl.useProgram(this.program);

        // Enable blending for vignette overlay
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // Set up a fullscreen quad
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1,
        ]);

        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Get uniform locations
        this.timeLocation = this.gl.getUniformLocation(this.program, 'u_time');
        this.resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');

        return true;
    }

    render() {
        if (!this.gl || !this.program) return;

        const currentTime = (Date.now() - this.startTime) / 1000.0;

        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Update uniforms
        this.gl.uniform1f(this.timeLocation, currentTime);
        this.gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);

        // Draw the quad
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(() => this.render());
    }

    async start(shaderPath) {
        const success = await this.initShaders(shaderPath);
        if (success) {
            this.render();
        }
    }
}

// Initialize the renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const renderer = new WebGLRenderer('webgl-canvas');
    renderer.start('style/shader.glsl');
});

export default WebGLRenderer;