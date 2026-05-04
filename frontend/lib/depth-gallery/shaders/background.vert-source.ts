/**
 * Inlined for Next.js Turbopack (avoid custom raw loader).
 */
/* eslint-disable import/no-anonymous-default-export -- shader string blob */

export default `varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = vec4(position.xy, 0.0, 1.0);
}
`
