import { Renderer, Program, Mesh, Triangle } from "ogl";
import { useEffect, useRef } from "react";

function hexToVec4(hex) {
  hex = hex.replace("#", "");
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  return [r, g, b, 1];
}

const vertex = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;

uniform float iTime;
uniform vec2 iResolution;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec3 color = 0.5 + 0.5*cos(iTime + uv.xyx + vec3(0,2,4));
  gl_FragColor = vec4(color,1.0);
}
`;

export default function Balatro() {
  const ref = useRef();

  useEffect(() => {
    const renderer = new Renderer();
    const gl = renderer.gl;

    ref.current.appendChild(gl.canvas);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: [window.innerWidth, window.innerHeight] }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      program.uniforms.iResolution.value = [
        gl.canvas.width,
        gl.canvas.height
      ];
    }

    window.addEventListener("resize", resize);
    resize();

    function update(t) {
      requestAnimationFrame(update);
      program.uniforms.iTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }

    requestAnimationFrame(update);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <div ref={ref} className="balatro-container"></div>;
}
