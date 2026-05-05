/**
 * GLSL inlined for Next.js Turbopack (avoid custom raw loader).
 */
/* eslint-disable import/no-anonymous-default-export -- shader string blob */

export default `varying vec2 vScreenUv;
varying vec2 vContainUv;
varying float vContainMask;

uniform sampler2D uTexture;
uniform vec3 uBaseColor;
uniform vec2 uResolution;
uniform float uTime;
uniform float uEdgeDistortionStrength;
uniform float uEdgeWidth;
uniform float uBaseDistortionStrength;
uniform float uBaseLightStrength;
uniform float uPassageStrength;
uniform float uPassageEnterPhase;
uniform float uPassageChromaMultiply;
uniform float uPassageEdgeDispersal;
uniform float opacity;

float hash21(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	float a = hash21(i);
	float b = hash21(i + vec2(1.0, 0.0));
	float c = hash21(i + vec2(0.0, 1.0));
	float d = hash21(i + vec2(1.0, 1.0));
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float causticBand(
	vec2 q,
	float ax,
	float ay,
	float spx,
	float spy,
	float t
) {
	return sin(ax * q.x + t * spx) * sin(ay * q.y + t * spy);
}

void main() {
	if (vContainMask < 0.5) {
		gl_FragColor = vec4(0.0);
		return;
	}

	float t = uTime;
	vec2 uv = vContainUv;
	vec2 suv = vScreenUv;

	float left = 1.0 - smoothstep(0.0, uEdgeWidth, suv.x);
	float right = 1.0 - smoothstep(0.0, uEdgeWidth, 1.0 - suv.x);
	float bottom = 1.0 - smoothstep(0.0, uEdgeWidth, suv.y);
	float top = 1.0 - smoothstep(0.0, uEdgeWidth, 1.0 - suv.y);

	left = pow(max(left, 0.0), 1.45);
	right = pow(max(right, 0.0), 1.45);
	top = pow(max(top, 0.0), 1.45);
	bottom = pow(max(bottom, 0.0), 1.45);

	float edge = clamp(left + right + top + bottom, 0.0, 1.0);
	float hDiff = left - right;
	float vDiff = bottom - top;

	vec2 q = uv * 6.28318;

	float c1 = causticBand(q, 2.1, 2.7, 0.31, 0.27, t);
	c1 += causticBand(q * 1.13, 3.4, 1.9, -0.22, 0.35, t * 1.07);
	c1 += causticBand(q * 0.91, 1.6, 3.1, 0.18, -0.29, t * 0.93);

	vec2 q2 = uv * 14.0;
	float c2 = causticBand(q2, 4.2, 3.8, 0.52, -0.41, t * 1.12);
	c2 += causticBand(q2 * 1.07, 5.1, 2.4, -0.38, 0.44, t * 0.88);

	vec2 q3 = uv * 38.0;
	float c3 = causticBand(q3, 7.0, 6.5, 0.71, 0.63, t * 1.18);
	c3 += causticBand(q3 * 1.05, 8.2, 5.1, -0.55, 0.59, t * 0.95);

	float causticRaw = c1 * 0.55 + c2 * 0.32 + c3 * 0.13;
	float caustic = pow(abs(causticRaw), 0.6);

	vec2 center = uv - 0.5;
	float dist = length(center);
	float ripple = sin(dist * 20.0 - t * 2.4) * exp(-dist * 2.0);

	float roll = sin(uv.x * 3.1 + t * 0.15) * sin(uv.y * 2.7 - t * 0.12);

	vec2 nuv = uv * vec2(48.0, 52.0) + t * 0.4;
	float n = valueNoise(nuv) * 2.0 - 1.0;

	float field = caustic * 0.85 + ripple * 0.35 + roll * 0.22 + n * 0.12;

	float passageRadial = pow(max(1.0 - dist * 1.92, 0.0), 1.42);
	float passageEdgeBoost = clamp(edge * 1.25, 0.0, 1.0);
	float passageMask = mix(
		passageRadial,
		passageEdgeBoost,
		clamp(uPassageEdgeDispersal, 0.0, 1.0)
	);
	float passageDispScale = mix(1.0, 1.35, clamp(uPassageEdgeDispersal, 0.0, 1.0));

	vec2 swirl = vec2(
		cos(field * 9.15 + uv.x * 23.8 - t * 1.04),
		sin(field * 8.47 + uv.y * 26.5 + t * 1.06)
	);
	float enterFlip = mix(1.0, -1.0, uPassageEnterPhase);
	swirl =
		normalize(vec2(swirl.x, swirl.y * enterFlip) + vec2(0.001)) * passageMask;
	vec2 passageDisp =
		swirl *
		uPassageStrength *
		0.058 *
		passageDispScale *
		passageMask;

	vec2 abNorm = vec2(1.0 / uResolution.x, 1.0 / uResolution.y);
	float abEdge = 4.2 * edge;
	float abPass =
		uPassageStrength *
		passageMask *
		max(uPassageChromaMultiply, 1.0) *
		0.92;
	vec2 abOff = abNorm * max(abEdge, abPass);

	vec2 baseFlow = vec2(
		cos(field * 6.28318 + uv.x * 9.4 - t * 0.62),
		sin(field * 6.28318 + uv.y * 8.7 + t * 0.54)
	);
	vec2 baseDisp =
		normalize(baseFlow + vec2(0.001)) *
		field *
		0.018 *
		uBaseDistortionStrength;

	vec2 edgeDisp = vec2(0.0);
	edgeDisp.x += hDiff * field * 0.045;
	edgeDisp.y += vDiff * field * -0.045;
	edgeDisp.x += (top + bottom) * sin(uv.y * 9.0 + t * 0.5) * 0.012 * edge;
	edgeDisp.y += (left + right) * sin(uv.x * 8.0 - t * 0.45) * 0.012 * edge;
	edgeDisp *= uEdgeDistortionStrength * edge * edge;

	vec2 disp = baseDisp + edgeDisp;

	vec2 distortedUv = uv + passageDisp + disp;
	if (
		distortedUv.x < 0.0 ||
		distortedUv.x > 1.0 ||
		distortedUv.y < 0.0 ||
		distortedUv.y > 1.0
	) {
		gl_FragColor = vec4(0.0);
		return;
	}

	vec4 baseSrgb = texture2D(uTexture, distortedUv);
	float rSrgb = texture2D(uTexture, distortedUv + abOff).r;
	float bSrgb = texture2D(uTexture, distortedUv - abOff).b;

	vec4 base = sRGBTransferEOTF(baseSrgb);
	vec3 col = base.rgb * uBaseColor;
	float rLin = sRGBTransferEOTF(vec4(vec3(rSrgb), 1.0)).r;
	float bLin = sRGBTransferEOTF(vec4(vec3(bSrgb), 1.0)).b;
	float passageChromaMix = clamp(
		uPassageStrength *
			passageMask *
			uPassageChromaMultiply *
			0.52,
		0.0,
		1.0
	);
	float chromaAmt = clamp(max(edge, passageChromaMix), 0.0, 1.0);
	col.r = mix(col.r, rLin * uBaseColor.r, chromaAmt);
	col.b = mix(col.b, bLin * uBaseColor.b, chromaAmt);

	float causticNorm = smoothstep(0.05, 0.95, caustic);
	float lightBoost = causticNorm * 0.35;
	float passageLight = uPassageStrength * passageMask;
	col *= 1.0 + lightBoost * uBaseLightStrength + lightBoost * edge + passageLight * 0.08;

	gl_FragColor = vec4(col, base.a * opacity);
	#include <colorspace_fragment>
}
`
